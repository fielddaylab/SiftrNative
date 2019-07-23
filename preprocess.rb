#!/usr/bin/env ruby

def preprocess(str, defs)
  stack = []
  output = []
  str.split("\n").each do |line|
    if md = line.match(/\/\/ @ifdef /)
      stack << md.post_match
    elsif line.match(/\/\/ @endif/)
      stack.pop
    else
      if stack.all? { |ident| defs.include?(ident) }
        output << line
      end
    end
  end
  output.join("\n")
end

Dir['src/*.js'].each do |js|
  str = File.read(js)
  File.write(js.gsub('src/', 'src-web/'), preprocess(str, ['WEB']))
  File.write(js.gsub('src/', 'src-native/'), preprocess(str, ['NATIVE']))
end
