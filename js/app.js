var App = Ember.Application.create();

App.Jigokuno = Ember.Object.extend({
  titleLower: function() {
    return this.get('title').toLowerCase();
  }.property('title'),
  characterLower: function() {
    return this.get('character').toLowerCase();
  }.property('character'),
  markdown: function() {
    return '![jigokuno ' + this.get('id') + '](' + this.get('image') + ')';
  }.property('image')
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
    return this.data.filter(function(item, index) {
      return self.isSubstring(item.get('titleLower'), queryLower)
          || self.isSubstring(item.get('characterLower'), queryLower)
          || item.id == query; // FIXME
    });
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
  }.property('query')
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

App.clip = new ZeroClipboard.Client();
App.clipGlued = false;
