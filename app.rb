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

  post '/api/test' do
    {test: "GOOD!"}.to_json
  end

  get '/sorry' do
    "😔😔😔"
  end

end

