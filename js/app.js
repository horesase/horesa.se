var App = Ember.Application.create();

App.Jigokuno = Ember.Object.extend({
  titleLower: function() {
    return this.get('title').toLowerCase();
  }.property('title'),
  characterLower: function() {
    return this.get('character').toLowerCase();
  }.property('character'),
  bodyLower: function() {
    return (this.get('body') || '').toLowerCase();
  }.property('body'),
  markdown: function() {
    return '[![' +this.escapeAlt(this.get('alt')) + '](' + this.get('image') + ')](' + this.get('entryUrl') + ')';
  }.property('image'),
  alt: function() {
    var body = this.get('body');
    if (body) {
      return body;
    } else {
      return this.get('id') + ' ' + this.get('title');
    }
  }.property('id', 'title'),
  entryUrl: function() {
    return "http://jigokuno.com/?eid=" + this.get('eid');
  }.property('eid'),
  escapeAlt: function(str) {
    return str.replace(/\]/g, '\\]').
      replace(/(?:\r|\n)+/g, ' ').
      replace(/\s+$/, '');
  }
});

App.Jigokuno.reopenClass({
  data: Ember.A(window.boys.map(function(entry) {
    return App.Jigokuno.create(entry);
  })),
  search: function(query, limit) {
    if (!query || query == "") {
      return [];
    }

    var self = this;
    var queryLower = query.toLowerCase();
    var filtered = this.data.filter(function(item, index) {
      return self.isSubstring(item.get('titleLower'), queryLower) ||
        self.isSubstring(item.get('characterLower'), queryLower) ||
        self.isSubstring(item.get('bodyLower'), queryLower) ||
        item.id == query;
    });
    var sorted = filtered.sort(function(a, b) {
      return b.eid - a.eid;
    });
    var limited = limit ? sorted.slice(0, limit) : sorted;

    return {hits: filtered.length, records: limited};
  },
  isSubstring: function(str, query) {
    return str.indexOf(query) >= 0;
  },
  find: function(id) {
    return this.data.findProperty('id', id);
  }
});

App.searchController = Ember.ArrayController.create({
  query: null,
  limit: 3*40,

  data: function() {
    return App.Jigokuno.search(this.get('query'), this.get('limit'));
  }.property('query', 'limit'),
  hits: function() {
    return this.get('data').hits;
  }.property('data'),
  content: function() {
    return this.get('data').records;
  }.property('data'),
  notFound: function() {
    var query = this.get('query') || '';
    return query != '' && !this.get('hits');
  }.property('query', 'hits'),
  hideClip: function() {
    if (!this.get('hits')) {
      App.clip.hide();
    }
  }.observes('hits'),
  isSnipped: function() {
    var hits = this.get('hits');
    return hits && hits > this.get('limit');
  }.property('hits', 'limit')
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

App.topController = Ember.ArrayController.create({
  content: Ember.A([
                   App.Jigokuno.find(786),
                   App.Jigokuno.find(537),
                   App.Jigokuno.find(295)
  ])
});

App.TopView = Ember.View.extend({
  controller: App.topController,
  templateName: 'top'
});

App.SearchView = Ember.View.extend({
  controller: App.searchController
});

App.MeigensView = Ember.View.extend({
  tagName: 'ul',
  classNames: 'thumbnails'.w(),
  template: Ember.Handlebars.compile('{{#each controller}}' +
    '{{view view.MeigenView contentBinding="this"}}' +
    '{{/each}}'),

  MeigenView: Ember.View.extend({
    templateName: 'meigen',
    tagName: 'li',
    classNames: 'span4',
    content: null,

    eventManager: Ember.Object.create({
      mouseEnter: function(e, view) {
        var target = e.target;
        if (target.className != "thumbnail meigen-thumbnail") {
          target = $(e.target).parents('div.meigen-thumbnail')[0];
        }
        if (!target) {
          return;
        }
        var content = view.get('content');
        var text = content.get('markdown');
        App.clip.setText(text);
        if (App.clipGlued) {
          App.clip.reposition(target);
        } else {
          App.clip.glue(target);
          App.clipGlued = true;
        }
      }
    })
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

