require 'open-uri'
require 'json'

JSON_URL = 'http://cloud.github.com/downloads/june29/horesase-boys/meigens.json'

task :default => :update

desc 'Fetch horesase-boys data and Update js/meigens.js'
task :update do
  # Regenerate json to make it compact
  json = JSON.parse(URI(JSON_URL).read)
  json_str = JSON.dump(json)

  js = 'window.meigens = ' + json_str + ';'
  File.write('js/meigens.js', js)
end
