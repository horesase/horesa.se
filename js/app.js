var App = Ember.Application.create();

App.Jigokuno = Ember.Object.extend({
});
App.Jigokuno.reopenClass({
  data: Ember.A(window.boys.map(function(entry) {
    return App.Jigokuno.create(entry);
  })),
  search: function(query) {
    if (query == "") {
      return [];
    }

    return this.data.filter(function(item, index) {
      return item.title.indexOf(query) >= 0
          || item.character.indexOf(query) >= 0
          || item.id == query; // FIXME
    });
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
  classNames: 'span4'
});
