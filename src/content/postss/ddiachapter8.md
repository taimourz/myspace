---
title: Designing Data Intensive Applications Chapter 8
date: 2025-10-01
---

## Introduction

The main idea in this chapter is that distributed systems are prone to failure for many reasons (nodes, clocks, network) unlike a single computer where programs that are deterministic (output is predictable). Therefore, we should assume faults will happen and design for resilience

> This nondeterminism and possiblity of partial failures (broken components) particularly makes distributed systems hard to work with.

## Unreliable Network

### Shared-nothing: nodes communicate only via network

In Shared nothing approach, each machine has it's own memory and disk and only communicates over the network. This is not the only way to build distributed systems but it is the most dominant approach.

>  - In distributed systems, communication is treated as asynchronous. Once a message it's sent, there are so many ways it can go wrong (lost, delayed, duplicated, reordered) and impossible to tell why. This behaviour is handled using `timeouts. 


### Timeout is main tool for detecting node/process failure

So, how long can a timeout be ? 

A long timeout can detect a dead node with more precision.

A Short timeout detects faults way faster, but carries the overhead of wrongly declaring a node dead when it could just be a slowdown

We can use the equation `2d + r` to find timeouts where `d` is max delay of packet and `r` is node processing time. However most networks have unbounded delays which means there is no upper limit on the time it may take to deliver a message

Most modern systems can periodically measure response times and variability (jitter) and automatically adjust timeouts according to calculated response time distribution

> Quick Fault discovery can helps in multiple ways: 
> 1) A load balancer can stop sending requests to a dead node
> 2) In case of single leader replication: a new follower can be promoted as a leader if the leader fails

### Queueing: A cause of network congestion

Lets see this scenario

- Multiple nodes sending packets to same destination
- Since CPU is already busy, request get queued up by OS
- TCP uses something called flow control (aka congestion avoidance or backpressure) where a node limits its own rate of sending in order to avoid overloading a network link or the receiving node. 

> TCP vs UDP
> - TCP is superior to UDP in following cases
> 1) flow control
> 2) Acknowledgement and Retransmission
> 3) Sequencing (Message arrives in the right order)
> - UDP shines in following:
> 1) latency-sensitive applications like video conferencing
> 2) delayed data is worthless so there is no need to retransmit eg call


## Unreliable clocks

Time is a tricky business in distributed systems b/c communication is not instantaneous, variable delays in network and the fact that each machine has it's own clock. However, it's possible to synchronize clocks using a protocol called NTP ( Network Time Protocol ): Time reported by group of servers

In case of working with software that needs synchronized clocks, we need to monitor offsets carefully as it can cause inconsistent ordering of events, invalid data etc

> Modern computers use 2 types of clocks: Monotonic Vs Time-of-Day clocks
> 
> - `Time-of-day clocks:` can jump backward/forward (NTP correction), not good for measuring durations or ordering. eg used in timestamps
> - `Monotonic clocks:` always moves forward, good for measuring durations/timeouts. eg used in elapsed time

### Event Ordering in Distributed Systems: Why Logical Clocks Beat Physical Clocks

It is tempting but dangerous to use clocks for ordering events across multiple nodes. eg, since both multi leader and leaderless databases such as Cassandara and Riak relay on LWW policy (last write win), it can lead to data loss.

> (last write wins -> data loss risk, b/c of clock skew)

Moreover, defination of "recent" is subjective as it depends on local time-of-day clock which can be incorrect. Even NTP synchronization accuracy is limited by network round trip time and quarts crystal drift

On the other hand, logical clocks based on counters are a safer alternative for event ordering in distributed systems. They do not measure time-of-day or elapsed time but relative order of events. This is why logical clocks are different from both time-of-day clocks and monotonic clocks.

> Logical clocks (Lamport, vector clocks) are safer for event ordering (no real time, just causality)

### Clock readings have confidence intervals (not exact, e.g. Spanner TrueTime)

We can think of a clock reading as a range of times, within a confidence interval eg: we are 95% sure that the time now is b/w 5.3 and 5.5. Google Spanner implements snapshot isolation using clock's confidence interval (guarantees order if intervals don't overlap). eg:
```bash
A = [A earliest, A latest]
B = [B earliest, B latest]
```
These two intervals do not overlap ( A earliest < A latest < B earliest < B latest ). This means B always happens after A

### Process Pauses

How does a node that it is still a leader ?

- Node can be paused due to many reasons 
  - Garbage Collection (stop the world)
  - laptop execution may suspend
  - context switches in OS
  - paging (swapping on disc)
  - VM migration
- Node may not know it was paused until it resumes (can miss heartbeats, lose leadership)

Therefore, a node must assume that its exection can be halted for a significant amount of time at any point.

## Knowledge, Truth and Lies


As alluded earlier, a node can not trust its own judgement of a situation, as a result many distributed systems rely on a `quorum` (voting among the nodes)

> Qrorum is when we have an absolute majority of more than half of the node (e.g. consensus, leader election)

### Fencing Tokens

Given a scenario where a node wrongly believes it is the chosen one while it is dead already, we use something called fencing tokens.

Basically it is an ever-increasing counter to prevent old/dead nodes from acting (protects against `split brain`)

> split brain: a situation where two (or more) nodes each believe they are the leader/master and continue to accept writes causing inconsistencies, conflicts, and possible data loss

How fencing tokens work?

1. Every time a lock server grants/leases a lock, it generates an ever increasing counter as a fencing token. We can then add the requirment that any client that want to send a write request must include the current fencing token. 

2. The lock server then performs a validation on any request with fencing token and if it has a generated token with a higher number, it rejects the request otherwise accepts it. (dead node has an outdated/lower number)

if ZooKeeper is used as a lock service, the transaction id `zcid` or the node version `cversion` can be used as a fencing token

### Byzantine Faults 

Previously we saw how to handle the case where a node is acting inadvetently in error (unreliable but honest)

However, what happens if nodes may lie, malfunction, or act maliciously (Byzantine behavior). eg, if a node may claim
to have received a particular message when in fact it didn’t.

> - `A system is Byzantine fault-tolerant:` if it continues to operate correctly even if some of the nodes are malfunctioning and not obeying protocol OR some malicious attackers are interfering with the network. eg with Aerospace environments
> - To mitigate this, we need an algorithm that needs a majority of more than 2/3 nodes to function correctly

### Weak forms of lying

Even if trust is established, there is still weak form of lying that exist such as hardware issues, software bugs, misconfiguration

Luckily, we can use methods like checksums, input validation to  tolerate them.

## System Model and Reality


We can categorise system models based on timing assuptions and  node failures 


### System models with regards to timing assumptions:

1. `Synchronous model:`   fixed upper bound on message delays (unrealistic in practice)
2. `Partially Synchronous model:` mostly synchronous, sometimes not (best real-world fit)
3. `ASynchronous model:` no timing assumptions, no clocks, no timeouts (very restrictive)

### System models with regards to node failures:

1. `Crash-stop-faults:`    node fails and never returns (simple failure)
2. `Crash-recovery-faults:`  node can return after failure (more realistic)
3. `Byzantine-faults:`    node can do anything (malicious, arbitrary faults)

> Most useful: partially synchronous + crash-recovery (matches real distributed systems)