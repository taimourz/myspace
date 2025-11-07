---
title: Build and Publish an OpenAPI SDK Generator Gem in Ruby
date: 2025-11-04
author: Taimour
tags: ruby, github, notes
draft: false
---

## Introduction

OpenAPI is a global standard for describing REST APIs. The descriptions are made either in yaml or json format. 

It contains information such as general description, metadata about the swagger version, and security information about how to access the API. It also lets us define paths (API endpoints) and the definitions (data structures for requests and responses). And here, OpenAPI allows the definition and usage of references.

> For example, you have a standard response object for all API endpoints. Instead of defining this data structure everywhere for all endpoints, we can just define it once in the definitions section, and then include a reference from the endpoint to this definition.

We can see it in this Example file [petstore.yaml ↗](https://github.com/OAI/OpenAPI-Specification/blob/16a2a701f6200ea6e78394753a74d4809374a7c8/_archive_/schemas/v3.0/pass/petstore-expanded.yaml) . [source ↗](https://petstore.swagger.io/). We will use this yaml file in this article.

A small sample API specification:

```yaml
openapi: 3.0.0
info:
  title: Petstore API
  description: A sample API for managing a pet store
  version: 1.0.0
servers:
  - url: https://petstore.swagger.io/v2
paths:
  /pets:
    get:
      summary: List all pets
      operationId: listPets
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        '200':
          description: An array of pets
components:
  schemas:
    Pet:
      type: object
      required:
        - name
      properties:
        id:
          type: integer
          description: Unique identifier
        name:
          type: string
          description: Name of the pet
        status:
          type: string
          enum: [available, pending, sold]
```


## Project Structure

```bash
.
├── Gemfile
├── Gemfile.lock
├── README.md
├── bin
│   └── openapi-sdk-generator
├── examples
│   └── petstore_client.rb
├── lib
│   ├── openapi_sdk_generator
│   │   ├── generator.rb
│   │   ├── generators
│   │   │   ├── javascript_generator.rb
│   │   │   └── ruby_generator.rb
│   │   ├── parser.rb
│   │   ├── parsers
│   │   └── templates
│   │       ├── javascript_client.erb
│   │       ├── ruby_client.erb
│   │       └── ruby_model.erb
│   └── openapi_sdk_generator.rb
├── openapi_sdk_generator.gemspec
├── output
│   ├── ...
├── spec
│   └── parser_spec.rb
└── test
    └── fixtures
        └── petstore.yaml
```

## Step 1: Architecture


### 1. The Parser - [parser.rb ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/lib/openapi_sdk_generator/parser.rb)

The parser is the brain of our generator. It reads OpenAPI specification file - [petstore.yaml ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/test/fixtures/petstore.yaml) 

It has the ability to parse input both from a file and a url. Once it has all the content, it then Extracts API endpoints, parameters, response schemas and finally parses data models and their properties

```ruby
module OpenapiSdkGenerator
  class Parser
    attr_reader :spec, :endpoints, :models, :base_url
    
    def initialize(file_path)
      @file_path = file_path
      @spec = load_spec
      @endpoints = []
      @models = {}
      @api_info = {}
      parse_spec
    end
    
    ...

    private

    def load_spec
      content = fetch_content
      parse_content(content)
    rescue => e
      raise Error, "Failed to load OpenAPI spec: #{e.message}"
    end
    
    def fetch_content
      if url?(@file_path)
        fetch_from_url(@file_path)
      else
        fetch_from_file(@file_path)
      end
    end    

    def fetch_content
      if url?(@file_path)
        fetch_from_url(@file_path)
      else
        fetch_from_file(@file_path)
      end
    end


    def parse_spec
      parse_info
      parse_servers
      parse_paths
      parse_schemas
    end    

    ...

  end
end
```

- `parse_paths`: Iterates through all API endpoints and extracts HTTP methods, paths, parameters, and responses
- `parse_schemas`: Extracts data model definitions from the `components/schemas` section
- `parse_parameters`: Handles query, path, header, and body parameters

> Here is how it looks
> ![[parselogic.png]]


### 2. Language-Specific Generators
 

All of our language-specific generators i.e ```ruby_generator.rb and javascript_generator.eb``` will inherit from [ generator.rb ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/lib/openapi_sdk_generator/generator.rb). It provides common utility methods and enforces rules that all its subclasses must follow.

#### Ruby Generator - [ruby_generator.rb ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/lib/openapi_sdk_generator/generators/ruby_generator.rb)

This class is responsible for generating ruby files as follows:

``` bash
├── output
│   ├── README.md
│   ├── client.rb
│   └── models
│       ├── error.rb
│       ├── newpet.rb
│       └── pet.rb

```

```ruby
module OpenapiSdkGenerator
  module Generators
    class RubyGenerator < Generator

      ...

      def write_to_directory(output_dir)
        FileUtils.mkdir_p(output_dir)
        FileUtils.mkdir_p(File.join(output_dir, 'models'))
        
        # Generate client.rb
        client_content = generate_client
        File.write(File.join(output_dir, 'client.rb'), client_content)
        
        # Generate models
        parser.models.each do |name, model|
          model_content = generate_model(model)
          filename = "#{sanitize_name(name)}.rb"
          File.write(File.join(output_dir, 'models', filename), model_content)
        end

        # Write readme file
        readme_content = generate_readme
        File.write(File.join(output_dir, 'README.md'), readme_content)
      end

       ...

    end
  end
end
```

> Here we can see the output that is going to get written in these files
> ![[rubygenerator.png]]

#### JavaScript Generator - [javascript_generator.rb ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/lib/openapi_sdk_generator/generators/javascript_generator.rb)

This class is responsible for generating javascript files as follows:

``` bash
├── output
│   ├── README.md
│   ├── client.js
│   └── package.json

```

```ruby
module OpenapiSdkGenerator
  module Generators
    class JavascriptGenerator < Generator

     ...

      def write_to_directory(output_dir)
        FileUtils.mkdir_p(output_dir)
        
        # Write client file
        client_content = generate_client
        File.write(File.join(output_dir, 'client.js'), client_content)
        
        # Write package.json
        package_json = generate_package_json
        File.write(File.join(output_dir, 'package.json'), package_json)

        # Write readme file
        readme_content = generate_readme
        File.write(File.join(output_dir, 'README.md'), readme_content)        
      end
      
      ...

    end
  end
end
```

> Here is how the output looks that is going to get written into these files
> ![[javascriptgenerator.png]]


### 4. Templates

we have prewritten templates that get dynamically populated during the runtime. These templates are used by our ruby and javascript generators

We have a total 3 templates

1. [ruby_client.erb ↗](http://github.com/taimourz/openapi_sdk_generator_gem/blob/main/lib/openapi_sdk_generator/templates/ruby_client.erb)
2. [ruby_model.erb ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/lib/openapi_sdk_generator/templates/ruby_model.erb)
3. [javascript_client.erb ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/lib/openapi_sdk_generator/templates/javascript_client.erb)


## Step 2: Running the application

There are 2 ways to generate output. we have these 2 script files.

1. [openapi-sdk-generator ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/bin/openapi-sdk-generator) acts as the "front desk" of our SDK Generator. It collects user input via command-line flags and validates them. If everything is fine, it passes control to the generator which handles ruby and js file generation.

2. [ petstore_client.rb ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/examples/petstore_client.rb) - This is a cutom script written only for our petstore example for our ease

#### Example - Using File:
```bash
./bin/openapi-sdk-generator --help
./bin/openapi-sdk-generator -i test/fixtures/petstore.yaml -o ./output -l javascript # generates only js files
./bin/openapi-sdk-generator -i test/fixtures/petstore.yaml -o ./output -l ruby       # generates only ruby files 
 ruby examples/petstore_client.rb                                                    # generates both files 
```


> Here is how you can use it. 
> ![[openapi-usage.png]]

#### Example - Using Url
```bash
./bin/openapi-sdk-generator -i https://raw.githubusercontent.com/taimourz/openapi_sdk_generator_gem/refs/heads/main/test/fixtures/petstore.yaml -o ./output -l ruby
./bin/openapi-sdk-generator -i https://raw.githubusercontent.com/taimourz/openapi_sdk_generator_gem/refs/heads/main/test/fixtures/petstore.yaml -o ./output -l javascript
```


## Step 3: Testing with RSpec

Testing is extemely crucial to verify if the genrated files are correct. In order to test our generated files we have written one spec file: 
 [parser_spec.rb ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/spec/parser_spec.rb). Right now, we only have tests for ruby but they are enough to get the point across.

 This spec ensures that:

- The OpenAPI document loads successfully
- API metadata (title, version, description) is correctly parsed
- Endpoints and parameters are extracted with correct HTTP methods & paths
- Models, properties, and required fields are resolved


![[rspec_parser.png]]


## Step 4: Publishing/Updating Gem

### 1. Building
Our [openapi_sdk_generator.gemspec ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/openapi_sdk_generator.gemspec) defines the gem metadata. 

Sign up on [ruby gems org](https://rubygems.org/) and generate an API key

```bash
mkdir -p ~/.gem
vim ~/.gem/credentials
```
copy paste your api key like this ( Dont worry api key is incorrect 😎 )
``` vim
---
:rubygems_api_key: rubygems_7bb74d7bb74d3f6468fdasfdasdafdsafdsa16c8b92dadfasda6adfd
```
Finally build and push
``` bash
chmod 0600 ~/.gem/credentials
gem signin
gem build openapi_sdk_generator.gemspec
gem push openapi_sdk_generator_gem-0.1.0.gem
```
> Here is how i did it
>![[publish_gem.png]]
>![[publishedgem.png]]


### 2. Pull from Ruby.org and verify

```bash
gem install openapi_sdk_generator_gem
ls ~/.rvm/gems/ruby-3.4.5/gems/openapi_sdk_generator_gem-0.1.0 # look in your own ruby version
cat  ~/.rvm/gems/ruby-3.4.5/gems/openapi_sdk_generator_gem-0.1.0/bin/openapi-sdk-generator
```

![[pullgem.png]]


**That's it!** Your gem is now live on RubyGems.org and anyone can install it.


### 3. Updating

Now that we have successfully published our gem and when we need to make an update, we would want to update it at regular intervals. Here is how we do it

First we need to increase the version number like this:

![[bumpversion.png]]

Finally push the updated gem:

``` bash
gem build openapi_sdk_generator.gemspec
gem push openapi_sdk_generator_gem-0.1.0.gem
```

## Resources

  1. [Github Repo](https://github.com/taimourz/openapi_sdk_generator_gem)
  2. [Gem on RubyOrg](https://rubygems.org/gems/openapi_sdk_generator_gem/versions/0.1.1)
  3. [OpenApi Specification](https://github.com/OAI/OpenAPI-Specification)
  4. [PetStore API](https://petstore.swagger.io/)