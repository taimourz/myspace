---
title: Publishing a Docker container to the GitHub Container Registry
date: 2025-11-3
---

If you have ever developed a cool application and wanted to share it and make sure it runs on every platform, the easiest solution is to containerise and publish it. 

Recently, I created a small [Notes CLI app](https://github.com/taimourz/Notes_app_cli), and I decided to package it into a Docker image so anyone can run it with a single command. In this post, I’ll show you how you can do the same for your own project.

> [!info]- Click Here to see Demo of notes app
>
> <div class="video-container">
>  <iframe src="https://www.youtube-nocookie.com/embed/ucE77QQUjCs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
> </div>

### Create a Dockerfile

```dockerfile
#I have used alpine here instead of ubuntu b/c it's very lightweight and fast
FROM node:20-alpine
# create app folder
WORKDIR /app
# Copy package.json and package-lock.json into app folder
COPY package*.json ./
# we use --production flag b/c we dont want dev dependencies like nodemon
RUN npm install --production
# copy our application code into app folder
COPY app.js notes.js ./
# we create a data directory for persistent storage in container. -p makes sure no error is thrown if folder already present
RUN mkdir -p /data
# finally we change work directory to data
WORKDIR /data
# run our main file i.e app.js
ENTRYPOINT ["node", "/app/app.js"]
```
 create a `.dockerignore` file to exclude unnecessary files like node_modules

### Create a GitHub Personal Access Token
We will use this generated token to get logged in to the GitHub Container Registry.

Create it with following scopes by going to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) - [this page here](https://github.com/settings/tokens/new)
- `write:packages`
- `read:packages`



``` bash
export CR_PAT=your_token_here
echo $CR_PAT | docker login ghcr.io -u taimourz --password-stdin
docker build -t ghcr.io/taimourz/notes-cli:latest .
```


### Finally test Your Image Locally and Push to GitHub Container Registry

```bash
docker run --rm ghcr.io/taimourz/notes-cli:latest --help
# Create a test directory for data
mkdir -p ~/test-notes
# adding notes
docker run --rm -v ~/test-notes:/data ghcr.io/taimourz/notes-cli:latest add --title="Test" --body="My first containerized note"
# listing notes
docker run --rm -v ~/test-notes:/data ghcr.io/taimourz/notes-cli:latest list
# push into github registry
docker push ghcr.io/taimourz/notes-cli:latest
# pull to see if it works
docker pull ghcr.io/taimourz/notes-cli:latest
```

- `--rm:` Automatically remove the container after it exits
- `-v ~/test-notes:/data:` Mount a local directory for persistent data storage

> Here is how I did it.
> ![[testingdocker.png]]

### How to unpublish/delete, change visibility

By default the packages are private. If you want to share it with everyone, make them public by going to ```https://github.com/taimourz?tab=packages```
You can also delete the package here.

![[publishedpackage.png]]


There is also an option to delete it using terminal like this

``` bash
#login into GitHub Container Registry
echo $CR_PAT | gh auth login --with-token          # if token
docker login ghcr.io -u taimourz --password-stdin  # if password
# verify package exists
gh api /user/packages/container/notes-cli
# delete the package
gh api -X DELETE /user/packages/container/notes-cli
```