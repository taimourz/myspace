---
title: Setup VMs using QEMU and Test using ssh, netcat
date: 2025-11-11
---

## Introduction

[QEMU (Quick Emulator)](https://github.com/qemu/qemu) is a powerful open-source virtualization tool that allows you to run virtual machines on your computer.

### What we will do

 - setup Ubuntu desktop VM, test it with SSH access and netcat
 - setup Ubuntu live-server VM, test it with SSH access as well

I am using macOS (Intel-based) but the procoess is same for all linux with minor variations


## Step 1: Installation (Desktop)

### i. install QEMU

```bash

brew install qemu
cd /usr/local/opt/qemu/bin
ls

```

we navigate to the QEMU binaries directory and see various `qemu-system-*` binaries. Since we're on an x86_64 architecture (Intel Mac), we'll use `qemu-system-x86_64`.

### ii. Download Ubuntu ISO images

```bash

wget https://releases.ubuntu.com/focal/ubuntu-20.04.6-desktop-amd64.iso
wget https://releases.ubuntu.com/focal/ubuntu-20.04.6-live-server-amd64.iso

```

Personally, I prefer to use live-server b/c it is lightweight and fast but gui has it's own benefits so I just keep it around just in case !

### iii. Create a Virtual Disk Image

Create a 60GB virtual disk that will serve as your VM's hard drive:

```bash

qemu-img create -f qcow2 ubuntu2004.qcow2 60G

```
- `qemu-img create`: QEMU's disk image creation tool
- `-f qcow2`: Specifies the qcow2 format (QEMU Copy-On-Write version 2)
- `ubuntu2004.qcow2`: The filename for your virtual disk
- `60G`: The maximum size of the disk (it starts small and grows as needed)

The qcow2 format is space-efficient because it only uses disk space for data actually written to it, not the entire 60GB upfront.

### iv. Install Ubuntu Desktop

```bash
qemu-system-x86_64 \
  -accel tcg \
  -smp 2 \
  -m 4G \
  -boot d \
  -vga std \
  -cdrom ubuntu-20.04.6-desktop-amd64.iso \
  -drive file=ubuntu2004.qcow2,if=virtio
```

- `-accel tcg`: Use TCG (Tiny Code Generator) for software-based CPU emulation
- `-smp 2`: Allocate 2 CPU cores to the VM
- `-m 4G`: Allocate 4GB of RAM
- `-boot d`: Boot from CD-ROM (the 'd' stands for CD-ROM drive)
- `-vga std`: Use standard VGA graphics (most compatible)
- `-cdrom ubuntu-20.04.6-desktop-amd64.iso`: Mount the Ubuntu ISO as a CD-ROM
- `-drive file=ubuntu2004.qcow2,if=virtio`: Attach our virtual disk with VirtIO interface for better performance

> Why Not Use host machine Hardware Acceleration?
>
> using `-accel hvf` (Apple's Hypervisor Framework) or `-cpu host` gives better performance. but it don't work for ubuntu desktop. This [passthrough](https://bugs.launchpad.net/qemu/+bug/1894836) used to work but now it is not working anymore.
>
> I was able to make hvf work work for ubuntu live-server, we will see later in article.
>




Now go through with the normal setup instructions

![[install1.png]]

## Step 2: Testing

### i. Boot Your Installed Ubuntu VM

Now that Ubuntu is installed, we can boot from the virtual disk without the ISO. 

> We'll also add networking and port forwarding in order to test it using netcat and ssh

```bash
qemu-system-x86_64 \
  -accel tcg \
  -smp 2 \
  -m 4G \
  -vga std \
  -usb \
  -device usb-tablet \
  -device virtio-net,netdev=vmnic \
  -netdev user,id=vmnic,hostfwd=tcp::2222-:22,hostfwd=tcp::9999-:9999 \
  -audiodev coreaudio,id=coreaudio \
  -device ich9-intel-hda -device hda-output,audiodev=coreaudio \
  -drive file=ubuntu2004.qcow2,if=virtio
```

- `-usb` and `-device usb-tablet`: Enable USB and add a tablet device for better mouse integration
- `-device virtio-net,netdev=vmnic`: Add a virtual network card
- `-netdev user,id=vmnic,hostfwd=tcp::2222-:22,hostfwd=tcp::9999-:9999`: Configure user-mode networking with port forwarding
  - `hostfwd=tcp::2222-:22`: Forward Mac's port 2222 to VM's port 22 (SSH)
  - `hostfwd=tcp::9999-:9999`: Forward Mac's port 9999 to VM's port 9999 (for testing)
- `-audiodev coreaudio,id=coreaudio`: Enable audio using macOS's Core Audio
- `-device ich9-intel-hda -device hda-output,audiodev=coreaudio`: Add Intel HDA audio device



### ii. Connection with Netcat

In your Ubuntu VM terminal:

```bash
sudo apt update
sudo apt install netcat -y
nc -l -p 9999  # starts netcat listening on port 9999.
```

On your host terminal:
```bash

nc localhost 9999
```
Now type a message in either terminal and press Enter. The message should appear in the other terminal! This confirms that port forwarding is working.


### iii. Connection with SSH


Install OpenSSH Server in Ubuntu VM:

```bash
sudo apt update
sudo apt install openssh-server -y
sudo systemctl start ssh
sudo systemctl enable ssh
sudo systemctl status ssh # verify its started and working
```

On your host terminal:

```bash

ssh -p 2222 taimourz@localhost # use your own username

```

### iv. Demo (SSh and netcat)


> <div class="video-container">
>  <iframe src="https://www.youtube-nocookie.com/embed/zrQcqxbTW48" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
> </div>

## Step 3: Installation (Server)


### i. why we need it

First of all it's really fast. mac does not give you the control you need. 


> The whole process is same as desktop with a few changes

### ii. create virtual image
``` bash
qemu-img create -f qcow2 ubuntu-server.qcow2 60G
```


### iii install into virtual disc

``` bash
qemu-system-x86_64 \
  -accel tcg \
  -smp 2 \
  -m 4G \
  -boot d \
  -cdrom ubuntu-22.04.5-live-server-amd64.iso \
  -drive file=ubuntu-server.qcow,if=virtio,format=qcow2
```


### iv. update grub


first boot in normal gui mode otherwise so we can make changes in the grub file so next time we can run it from the terminal

``` bash
qemu-system-x86_64 \
  -accel tcg \
  -smp 2 \
  -m 4G \
  -drive file=ubuntu-server.qcow2,if=virtio,format=qcow2 \
  -device virtio-net,netdev=vmnic \
  -netdev user,id=vmnic,hostfwd=tcp::2222-:22

```


Once you have logged in, then you would need to update the grub file `/etc/default/grub`

``` bash
GRUB_CMDLINE_LINUX_DEFAULT="console=tty0 console=ttyS0,115200n8"
GRUB_CMDLINE_LINUX="console=tty0 console=ttyS0,115200n8"
GRUB_TERMINAL="serial console"
GRUB_SERIAL_COMMAND="serial --speed=115200 --unit=0 --word=8 --parity=no --stop=1"
```


then we run these commands

``` bash
sudo update-grub
sudo systemctl enable serial-getty@ttyS0.service
sudo systemctl start serial-getty@ttyS0.service
sudo shutdown -h now

```

### v. boot directly from terminal

> I was able to get the hvf running in the server. This will run blazingly fast.

``` bash
qemu-system-x86_64 -m 4G -hda ubuntu-server.qcow2 -accel hvf \
  -net nic -net user,hostfwd=tcp::2222-:22,hostfwd=tcp::9999-:9999 \
  -serial mon:stdio \
  -nographic
```



### vi. Testing with SSH

Create a new user from guest VM:
``` bash

sudo adduser taimour
id taimour            # verify
uid=1001(taimour) gid=1001(taimour) groups=1001(taimour)
```


The do ssh from host machine
``` bash

ssh -p 2222 taimour@localhost

```

### Demo
> <div class="video-container">
>  <iframe src="https://www.youtube-nocookie.com/embed/bQSi5YHL7uw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
> </div>