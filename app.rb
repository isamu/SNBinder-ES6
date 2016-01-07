# encoding: UTF-8
require "sinatra/base"
require "sinatra/reloader" 
require "sinatra/config_file"
require "sinatra/extension"
require 'rack/contrib'
require 'digest/sha1'
require 'net/http'
require 'open-uri' 
require "net/http"
require "json"

class App < Sinatra::Base

  set :root, File.dirname(__FILE__)

  get '/api/test' do
    {test: "OK!"}.to_json
  end

  get '/api/test/find' do
    {
      data: [ 
        {id: 1, name: "test1"},
        {id: 2, name: "test2"},
        {id: 3, name: "test3"},
        {id: 4, name: "test4"}
      ]
    }.to_json
  end

  post '/api/test/update/:id' do
    {
      data: { 
             id: params[:id],
             name: params[:name]
            }
    }.to_json
  end

  put '/api/test/create' do
    p params
    {
      data: { 
             id: 5,
             name: params[:name]
            }
    }.to_json
  end
  
  post '/api/test' do
    {test: "GOOD!"}.to_json
  end

  get '/sorry' do
    "😔😔😔"
  end

end

