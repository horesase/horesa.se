var App = Ember.Application.create();

App.Jigokuno = Ember.Object.extend({
});
App.Jigokuno.reopenClass({
  data: Ember.A([
    {id: 977, title: "これだけ", character: "ヤック(24)", image: "http://img.jigokuno.com/20121002_177891.gif"}
  ]),
  search: function(query) {
    if (query == "") {
      return [];
    }

    return this.data.filter(function(item, index) {
      return item.title.indexOf(query) >= 0; // FIXME
    });
  }
});

App.searchController = Ember.ArrayController.create({
  query: null,

  content: function() {
    console.log(this.get('query'));
    return App.Jigokuno.search(this.get('query'));
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
