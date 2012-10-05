var App = Ember.Application.create();

App.Meigen = Ember.Object.extend({
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

App.Meigen.reopenClass({
  data: Ember.A(window.meigens.map(function(entry) {
    return App.Meigen.create(entry);
  })),
  search: function(query, limit, cidFacet) {
    var self = this;
    var queryLower = (query || '').toLowerCase();
    var filtered = this.data.filter(function(item, index) {
      return (!cidFacet || item.get('cid') === cidFacet) &&
        (!query || (
          self.isSubstring(item.get('titleLower'), queryLower) ||
          self.isSubstring(item.get('characterLower'), queryLower) ||
          self.isSubstring(item.get('bodyLower'), queryLower) ||
          item.id == query
        )
      );
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
  },
  sample: function(n) {
    var i;
    var sampled = Ember.A([]);
    var records = this.data;

    for (i = 0; i < n; i++) {
      if (records.length === 0) {
        return sampled;
      }
      var selected = records[Math.floor(Math.random() * records.length)];
      sampled.push(selected);
      records = records.without(selected);
    }

    return sampled;
  }
});

App.searchController = Ember.ArrayController.create({
  query: null,
  limit: 3*40,
  cidFacet: null,
  character: null,

  data: function() {
    var query = this.get('query');
    var cidFacet = this.get('cidFacet');
    var limit = this.get('limit');
    if ((!query || query === '') && !cidFacet) {
      return [];
    }
    return App.Meigen.search(query, limit, cidFacet);
  }.property('query', 'limit', 'cidFacet'),
  hits: function() {
    return this.get('data').hits;
  }.property('data'),
  content: function() {
    return this.get('data').records;
  }.property('data'),
  notFound: function() {
    var query = this.get('query') || '';
    return query !== '' && !this.get('hits');
  }.property('query', 'hits'),
  hideClip: function() {
    if (!this.get('hits')) {
      App.clip.hide();
    }
  }.observes('hits'),
  isSnipped: function() {
    var hits = this.get('hits');
    return hits && hits > this.get('limit');
  }.property('hits', 'limit'),
  isSearchWorking: function() {
    var query = this.get('query') || '';
    return !!((query !== '') || this.get('cidFacet'));
  }.property('query', 'cidFacet')
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
  },
  resetQuery: function() {
    this.get('controller').set('query', null);
  },
  resetCidFacet: function() {
    this.get('controller').set('cidFacet', null);
    this.get('controller').set('character', null);
  }
});

App.topController = Ember.ArrayController.extend({
  numberOfMeigens: 3,
  content: [],
  init: function() {
    this.refresh();
  },
  refresh: function() {
    this.set('content', App.Meigen.sample(this.numberOfMeigens));
  }
}).create();

App.TopView = Ember.View.extend({
  controller: App.topController,
  templateName: 'top',

  refresh: function() {
    this.get('controller').refresh();
  }
});

App.SearchResultsView = Ember.View.extend({
  controller: App.searchController,
  templateName: 'search'
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
        var image = $('img.meigen', target)[0];
        var content = view.get('content');
        var text = content.get('markdown');
        App.clip.setText(text);
        if (App.clipGlued) {
          App.clip.reposition(image);
        } else {
          App.clip.glue(image);
          App.clipGlued = true;
        }
      }
    }),
    selectCharacter: function() {
      var character = this.get('content').get('character');
      var cid = this.get('content').get('cid');
      App.searchController.set('cidFacet', cid);
      App.searchController.set('character', character);
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

