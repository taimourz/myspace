---
title: Designing Data Intensive Applications Chapter 2
date: 2025-10-01
draft: true
---

## Introduction

This chapter covers 2 mainstream data models (Relational vs Document) in detail along with less popular ones that include graph like data models. We will also look at the Query languages used to interact with different data models

Data models shape how we think about the problem (structure it, query it). Every layer of data provides abstractions for interactions for the layers above it. Good data model simplifies application code and evolution of the system.

## Relational vs Document Data models
### SQL

The most popular data model we have is SQL, its applications were rooted in relational databases for business processing in 1960s and 1970s. It was mainly used for transation and batch processing. 

In SQL, data is organised into relations (tables), which is unordered collection of tuples.

> Key traits of SQL data model
> 1. Schema on write (strict structure)
> 2. Strong consistency guarntees

### NoSQL
On the other hand, we have NoSQL data models. Earliest competitors were network and hierarchical model. These include:

- `Document Databases:`   Target use case is where data is self-contained and relationship b/w one document and another is rare
- `Graph Databases:`    They are totally opposite, they target use cases where anything is potentially related to anything. In short, focuses on relationships. eg: Neo4j, AllegroGraph.
   - They also include key value stores and wide column stores as well. 

### Object Relational Mismatch (aka Impedance mismatch)

`Problem:`    When using SQL model, if data is stored in relational tables, a translation layer is required, which is known as impedance mismatch. This simply means, application in-memory structures (eg objects) are different from relational tables

`Solutions:`   
1. Normalized databases with foreign keys
2. Using a database that supports structured data (eg PostgreSQL)
3. Encode as JSON or XML and store in DB. (can't be queried this way)
4. Using document databases to store JSON like structures. This has better locality then normalised representation (less mapping overhead)


### JSON model

Advantages:
1. Schema flexibility (schema on read).
2. Provides better locality b/c all the related data is stored in one place.
3. Easy mapping to application objects which reduces imedance mismatch

Trade offs:
1. No built in joins
2. Large documents lead to inefficiency which only tiny amount of data is needed

### Handling Relationships (Many-to-Many / Many-to-One)

These relationships require references or ids to avoid data duplication
  - eg: using `user_id` instead of embedding user details everywhere
  - `Decision:`  Embed vs Reference depends on the access patterns

## Are document databases repeating history  
### The network model (CODASYL)

These models allow multiple parents for each record. Instead of using foreign keys, they are connected to one another via pointers (called access paths)

`Advantange:` Query is done by moving a cursor through a database by iterating over lists of records and following paths. In short, efficient traversal through predefined access patterns

`Disadvantage:` Although it proved most efficient with respect to use of hardware, this model made quering and updating the database complicated and inflexible. Queries are complex, rigid and have poor ad hoc querying flexibility


### Relational vs. Document Databases Today