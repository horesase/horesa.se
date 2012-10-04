var App = Ember.Application.create();

App.Jigokuno = Ember.Object.extend({
  titleLower: function() {
    return this.get('title').toLowerCase();
  }.property('title'),
  characterLower: function() {
    return this.get('character').toLowerCase();
  }.property('character'),
  markdown: function() {
    return '[![' +this.escapeAlt(this.get('alt')) + '](' + this.get('image') + ')](' + this.get('entryUrl') + ')';
  }.property('image'),
  alt: function() {
    return this.get('id') + ' ' + this.get('title'); // TODO Use body if exists
  }.property('id', 'title'),
  entryUrl: function() {
    return "http://jigokuno.com/?eid=" + this.get('eid');
  }.property('eid'),
  escapeAlt: function(str) {
    return str.replace(']', '\\]').replace(/\r|\n/, '');
  },
});
App.Jigokuno.reopenClass({
  data: Ember.A(window.boys.map(function(entry) {
    return App.Jigokuno.create(entry);
  })),
  search: function(query) {
    if (!query || query == "") {
      return [];
    }

    var self = this;
    var queryLower = query.toLowerCase();
    var filtered = this.data.filter(function(item, index) {
      return self.isSubstring(item.get('titleLower'), queryLower)
          || self.isSubstring(item.get('characterLower'), queryLower)
          || item.id == query; // FIXME
    });
    var sorted = filtered.sort(function(a, b) {
      return b.eid - a.eid;
    });

    return sorted;
  },
  isSubstring: function(str, query) {
    return str.indexOf(query) >= 0;
  }
});

App.searchController = Ember.ArrayController.create({
  query: null,
  hits: null,

  content: function() {
    var results = App.Jigokuno.search(this.get('query'));
    this.set('hits', results.length > 0 ? results.length : null);

    return results;
  }.property('query'),
  notFound: function() {
    var query = this.get('query') || '';
    return query != '' && !this.get('hits');
  }.property('query', 'hits'),
  hideClip: function() {
    if (!this.get('hits')) {
      App.clip.hide();
    }
  }.observes('hits')
});

App.SearchFormView = Ember.View.extend({
  tagName: 'form',
  controller: App.searchController,
  classNames: ['navbar-search', 'pull-left'],
  didInsertElement: function() {
    Ember.$('form input[type="text"]').focus();
  },
  submit: function(event) {
    event.preventDefault();
  }
});

App.SearchView = Ember.View.extend({
  controller: App.searchController
});

App.BoyView = Ember.View.extend({
  templateName: 'boy',
  tagName: 'li',
  classNames: 'span4',
  content: null,

  eventManager: Ember.Object.create({
    mouseEnter: function(e, view) {
      var content = view.get('content');
      var text = content.get('markdown');
      App.clip.setText(text);
      if (App.clipGlued) {
        App.clip.reposition(e.target);
      } else {
        App.clip.glue(e.target);
        App.clipGlued = true;
      }
    }
  })
});

App.message = Ember.Object.create({
  text: null,

  flash: function(message) {
    var self = this;
    self.set('text', message);
    setTimeout(function() {
      self.clear();
    }, 500);
  },
  clear: function() {
    this.set('text', null);
  }
});

App.clip = new ZeroClipboard.Client();
App.clip.addEventListener('complete', function(client, text) {
  App.message.flash('Copied!');
});
App.clipGlued = false;

