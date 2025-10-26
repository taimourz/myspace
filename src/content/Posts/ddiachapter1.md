---
title: Designing Data Intensive Applications Chapter 1
date: 2025-10-05
---

## Introduction

This chapter discusses three important aspects when it comes to building data intensive applications i.e reliablity, scalability and maintainability. In addition to that, it talks about Requirements (functional and non-functional) along with the the building blocks (DBs, caches queues etc)

## Building blocks

Following is a list of Activities they need to perform

1. `Stores Data:` SQL/NoSQL databases (Postgres, Aurora, MongoDB, Dynamo)
2. `Recall results of expensive operations:` Cache eg Redis, memcached
3. `Searching indexes:` Key Value Stores — Elastisearch from AWS, Lucene
4. `Stream processes:`  Message Queues, e.g. Apache Kafka, RabbitMQ
5. `Batch processing:` eg, Azure Batch processing, Hadoop, Spark

## Functional/NonFunctional Requirements

1. `Functional:`    allowing data to be stored retrieved, searched, and processed in various ways
2. `NonFunctional:`  security, reliability, compliance, scalability, compatibility, and maintainability

> - `Reliability:` To work correctly even in the face of adversity
> - `Scalability:` Reasonable ways of dealing with growth
> - `Maintainability`: Be able to work on it productively

## Reliability

What are some of our expectations to consider a system reliable ?

- Applications perform as expected
- Fault tolerant
- Good performance
- It prevents abuse eg unauthorised access 

> ### Fault vs Failure
> Fault is when some component of our system deviates from its spec while failure is when our system stops providing service to the end user
> > Systems that are able to correctly able to anticipate faults and cope against them are called `fault-tolerant-systems`
>
> > It's impossible to eliminate faults, so we should aim to make design a system that's tolerant and even try to deliberately trigger them manually

Therefore, our system should expect faults (hardware, software, human) and we should design for graceful degradation.

### Hardware Faults

There are multiple ways to deal with hardware faults. One way would be through techniques such as Replication, redundancy, and backups to provide durability and availability. Another way that has now become popular is through software fault-tolerant techniques

eg, For a single server system, we need planned downtime if the machine needs to be rebooted (in case we need to apply OS security patches). However, for a distributed system, we can do this by applying patches to nodes one by one and our machine remaines fault tolerant.

> This is known as rolling upgrade: Entire system is upgraded without any downtime

### Software Errors 

Software failures are more correlated as compared to hardware failures. Meaning that, a fault in software of one node is more likely to cause many more system failures.

Eg, In case of a hardware, a rise in temperature of one server rack is unlikely to cause a large number of other hardware components to fail. On the other hand, a small software fault can trigger cascading failures.

> In short, sofware errors are more correlated, can cause widespread failures

### Human Errors

Humans are unreliable and cause configuration errors all the time which is leading cause of outages. 

Here are some ways to tackle these failures

- `Minimize with good UI:`  eg using admin interfaces.
- `Sandboxing:`      Providing fully featured non-production env where people can test and explore using real data, without effecting real users.
- `Testing:`     unit, integration and manual tests
- `Fast Recovery:`   fast to rollback configuration changes, roll out new code changes gradually (so unexpected bugs effect small subset of users) and tools to recompute data (in case old calculation was incorrect)
-  `Training:`      implementing good management practices and training


## Scalability

What are some of the things we can do to cope with increased load ?

1. Describe load
  - requests/min, users, etc
2. Describe performance
  - throughput, response time, percentiles (p50, p95, p99)
3. design to cope with load
  - Scale up: bigger machine
  - Scale out: more machines
  - Elastic: auto-scale with load
  - Stateful vs stateless: stateful scaling is harder

### Load

Load is described in terms of system type. It includes things such as requrest per minute, cache hits/minutes, simaultaneous users

> ### Twitter's Home Feed Example
> There goal was to serve millions of users their personalized feed. They looked at two models to deal with this and eventually decided to go with a hybrid approach 
> 
> `Pull Model (fan-out on read):`  Here, it generates the timeline by merging tweets from everyone the user follows. In simple words, when you post a tweet it's simply added to a global collection of tweets. When you open the timeline, it gets tweets from all the people you follow and merge them.
>  - Pros: Great for write efficiency
>  - Cons: expensive on reads.
>
> `Push Model (fan-out on write):` In this case, every new tweet is written into home timeline of every follower. In simple words, when you post a tweet, we look at all the poeple you follow and insert a tweet into each person timeline.
>  - Pros: Super fast reads
>  - Cons: writes explodes for user (celebrity) with millions of followers
>
> > #### Hybrid approach
> > - for regular accounts, tweets are pushed into follower's cached feeds, making reads instant
> > - For eelebrity or high follower accounts, tweets are pulled on demand, avoiding massive writes

### Performance

Performance also depends on system type, for example, how much throughput can your system handle, what is your reponse time.

How to make sure that performance remains unchanged ?

One way would be see the load parameters and as they increase, you increase the resource required

> `Latency and response time:`    The response time is what the client sees and latency is the duration that a request has to wait to be handled

We use percentile as a metric to measure the performance of a system


> #### Percentile (position of a value relative to the rest of the dataset)
> eg: The 90th percentile means 90% of the values in the dataset are less than or equal to that value.
>
> > - Percentiles 95th, 99th and 99.9th (p95, p99 and p999) are good to figure out how bad your outliners are.
> > - Amazon, for example, describes response time requirements in terms of 99.9th percentile b/c the customers witht the slowest requests are often the ones with most data.  These are the most valuealbe customers and optimising for the 99.99th perctile is very expensive.

Another metric used very often to measure the performance are SLOs and SLAs

> #### SLOs (Service Level objectives) And SLAs (Service Level agreements)
> These are contracts that define the expected performance and availability of a service
>
> > Eg, an SLA may state the median response time to be less than 200ms and a 99th percentile under 1s.

And lastly, we will look at some of the factors that can effect the performance of our system

- `Queueing delays:` are the reason for the large response times in high percentiles. Since, parallelism is limited in servers, slow requests can cause `head-of-line blocking` and make subsequent requests slower
- As we know that the chain is as strong as its weakest link. To take an example, lets consider an end user for which the response time is the slowest out of all the parallel requrests that were made. The more backend requests we make, the higher the chance that one of the requests is going to be slow. This is called `tail latency amplification`.


### Approches For coping with load

1. `Scaling up (vertical scaling):`   Moving to a more powerful machine
2. `Scaling out (horizontal scaling):`    Distributing the load across multiple smaller machines
3. `Elastic:`   System will automatically add more computing resources when detected with increased load.

> #### Stateful Vs Stateless
> Scaling up stateful data systems can be a very complex task. Taking a single node to a distributed setup introduces a lot of complexity. Until Recently, it was considered common wisdom to keep your database on a single node until the cost or availability requirements are no longer getting satisfied

## Maintainability

There are three design principles that a system must follow to be considered maintainable

1. `Operability:`  Make it easy for the operations team to keep the system running.
2. `Simplicity:`  It's easy for new engineers to understand and should remove as much complexity as possible
3. `Evolvability:`   Make it easier for engineers to make changes in the future.

### Operability 

As mentioned earlier, it should make operation teams tasks easier. These tasks include:

- Monitoring and quickly restoring the service in case it goes into a bad state
- Tracking down root cause of the problem
- Make sure that software and platform are kept up to date.
- Anticipate future problems
- work on establishing good practices and tools for development
- creating/preserving organisation knowledgebase about the system.

Data systems can help in following ways to make the routine tasks easier:

- provide visibility into the runtime behaviour and internals of the systme with good monitoring
- provide good support for automation and integration with standard tools.
- It should provide good documentation and easily understandable operational model
- Self-healing when approprate but at the same time, it should give administrators manual control over the system as needed.

### Simplicity

The aim of our software is to get away from `accidental complexity`. It means that Sometimes features are added in the system that are totally unrelated to the problem software was designed to sovle. 

One of the great tools to remove complexity is through abstraction, that hides the implementation details behind a clean and simple to understand facade

### Evolvability

As we all know that the requirements are never the same, they keep changing with time, so we should ensure that we are able to deal with those changes. There are two types of requiements


- `Functional requirements:`    They tell about what the application should do.
- `Nonfunctional requirements:`    They include general properties such as security, reliability, compliance, scalability, compatibility and maintainability.