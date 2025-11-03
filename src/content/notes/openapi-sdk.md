---
title: Building an OpenAPI SDK Generator and publishing Your First Ruby Gem 
date: 2025-11-04
author: Taimour
tags: ruby, github, notes
---

Have you ever wondered how companies like Stripe, Twilio, or GitHub provide client libraries for multiple programming languages? They use SDK generators! In this tutorial, I'll walk you through building `openapi_sdk_generator` - a Ruby gem that reads an OpenAPI specification and automatically creates client libraries in multiple languages.

## Prerequisites 

We would need a an OpenAPI Specification. We would use this to generate a type-safe client SDKs in different languages. In this app, we are going to convert it into Ruby and JavaScript sdk along with their documentation (readme files).

Example files [petstore.yaml ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/test/fixtures/petstore.yaml) . [petstore.json ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/test/fixtures/petstore.json)  . [source ↗](https://petstore.swagger.io/)

For this article, I have used yaml but json i have also generated json output 

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
  /pets/{petId}:
    get:
      summary: Get a pet by ID
      operationId: getPetById
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: A pet object
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
│   ├── javascript
│   │   ├── README.md
│   │   ├── client.js
│   │   └── package.json
│   └── ruby
│       ├── README.md
│       ├── client.rb
│       └── models
│           └── pet.rb
├── spec
│   └── parser_spec.rb
└── test
    └── fixtures
        └── petstore.yaml
```

## Step 1: Architecture


### 1. The Parser - [parser.rb ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/lib/openapi_sdk_generator/parser.rb)

The parser is the brain of our generator. It reads OpenAPI specifications (JSON or YAML) - [petstore.yaml ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/test/fixtures/petstore.yaml)

Then it Extracts API endpoints, parameters, response schemas and finally parses data models and their properties

```ruby
module OpenapiSdkGenerator
  class Parser
    attr_reader :spec, :endpoints, :models, :base_url
    
    def initialize(file_path)
      @spec = load_spec(file_path)
      @endpoints = []
      @models = {}
      parse_spec
    end
    
    ...

    private
    
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
#### [ generator.rb ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/lib/openapi_sdk_generator/generator.rb)

All of our language-specific SDK generators (ruby and javascript) will inherit this class. It provides common utility methods and enforces rules that all its subclasses must follow.

#### Ruby Generator - [ruby_generator.rb ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/lib/openapi_sdk_generator/generators/ruby_generator.rb)

This class is responsible for generating ruby files i.e ` Readme.md, client.rb and models/pets.rb `
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
 
**Output example:**
```bash
output/ruby/
├── README.md - A README with usage examples
├── client.rb - A main `client.rb` file with all API methods
└── models/   - Individual model files in a `models/` directory
    └── pet.rb
```

> Here we can see the output that is going to get written in these files
> ![[rubygenerator.png]]

#### JavaScript Generator - [javascript_generator.rb ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/lib/openapi_sdk_generator/generators/javascript_generator.rb)

This class is responsible for generating javascript files i.e `Readme.md, client.js and package.json `

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

**Output example:**
```bash
output/javascript/
├── README.md    - A README with usage examples
├── client.js    - A `client.js` file with async/await methods
└── package.json - A `package.json` for npm compatibility
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

2. [ petstore_client.rb ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/examples/petstore_client.rb) - will only work for pet store example

Examples:
```bash
./bin/openapi-sdk-generator --help
./bin/openapi-sdk-generator -i test/fixtures/petstore.yaml -o ./output -l javascript # generates only js files
./bin/openapi-sdk-generator -i test/fixtures/petstore.yaml -o ./output -l ruby       # generates only ruby files 
 ruby examples/petstore_client.rb                                                    # generates both files 
```


> Here is how you can use it. 
> ![[openapi-usage.png]]




## Step 3: Testing with RSpec

Testing is extemely crucial to verify if the genrated files are correct. In order to test our generated files we have written one spec file: 
 [parser_spec.rb ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/spec/parser_spec.rb)

I only have tests for ruby b/c noone likes to write tests :)

![[rspec_parser.png]]

## Step 4: Publishing Your Gem

### 1. Building
Our [openapi_sdk_generator.gemspec ↗](https://github.com/taimourz/openapi_sdk_generator_gem/blob/main/openapi_sdk_generator.gemspec) defines the gem metadata. 

Sign up on [ruby gems org](https://rubygems.org/) and generate an API key

```bash
mkdir -p ~/.gem
vim ~/.gem/credentials
```
copy paste your api key like this. Dont worry api key is incorrect 😎
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


