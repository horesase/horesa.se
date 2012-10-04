require 'open-uri'
require 'json'

JSON_URL = 'https://raw.github.com/june29/horesase-boys/master/meigens.json'

task :default => :update

desc 'Fetch horesase-boys data and Update js/boys.js'
task :update do
  # Regenerate json to make it compact
  json = JSON.parse(URI(JSON_URL).read)
  json_str = JSON.dump(json)

  js = 'window.boys = ' + json_str + ';'
  File.write('js/boys.js', js)
end
