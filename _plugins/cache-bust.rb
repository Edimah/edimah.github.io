# Appends a content hash to an asset URL so a changed file is never served from
# cache. The hash is taken from the source file: for /assets/css/main.css that
# is assets/css/main.scss, which is what Jekyll compiles it from.
require 'digest/md5'

module Jekyll
  module CacheBust
    SOURCE_FALLBACKS = { '.css' => ['.scss', '.sass'] }.freeze

    def bust_file_cache(url)
      path = url.sub(%r{\A.*?assets/}, 'assets/').sub(/\?.*\z/, '')
      source = resolve_source(path)
      return url unless source

      "#{url}?#{Digest::MD5.file(source).hexdigest}"
    end

    private

    def resolve_source(path)
      return path if File.file?(path)

      SOURCE_FALLBACKS.fetch(File.extname(path), []).each do |ext|
        candidate = path.sub(/#{Regexp.escape(File.extname(path))}\z/, ext)
        return candidate if File.file?(candidate)
      end
      nil
    end
  end
end

Liquid::Template.register_filter(Jekyll::CacheBust)
