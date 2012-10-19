;(function( $, window, undefined ) {

  // Globals:

  var _defaults = {
      x: 4, y: 4,
      slider: false,
      effect: 'default',
      fade: false,
      random: false,
      reverse: false,
      limit: false,
      rewind: false,
      auto: false,
      loop: true,
      slideSpeed: 3500,
      tileSpeed: 800,
      cssSpeed: 300,
      nav: true,
      navWrap: null,
      beforeChange: $.noop,
      afterChange: $.noop
    }
    , Utils = {
     /**
      * range Get an array of numbers within a range
      * @param min {number} Lowest number in array
      * @param max {number} Highest number in array
      * @param rand {bool} Shuffle array
      * @return {array}
      */
      range: function( min, max, rand ) {
        var arr = ( new Array( ++max - min ) )
          .join('.').split('.')
          .map(function( v,i ){ return min + i })
        return rand
          ? arr.map(function( v ) { return [ Math.random(), v ] })
             .sort().map(function( v ) { return v[ 1 ] })
          : arr
      }
    }

  // Constructor:

  function TilesSlider( element, options ) {

    this.opts = $.extend( {}, _defaults, options )
    this.klass = 'tiles-'+ this.opts.effect
    this.klassNormal = this.klass + '-normal'
    this.klassAnim = this.klass + '-anim'
    this.n_tiles = this.opts.x * this.opts.y

    this.$container = $( element )
    this.$images = this.$container.find('img')
    this.$descriptions = this.$container.find('p')

    this.interval = null
    this.isAnimating = null

    // Assign in _init when elements are generated
    this.$tiles = null
    this.$navLinks = null

    if ( this.opts.rewind ) { this.opts.fade = true }

    this._init()

  }

  // Methods:

  TilesSlider.prototype = {

    _init: function() {

      var self = this
        , o = self.opts

      // Do nothing if there are no images
      if ( !self.$images.length ) { return false }

      self.$container.addClass('tiles-slider-wrap tiles-slider-'+
        o.effect +' tiles-slider-s'+ o.cssSpeed)

      // Generate tiles
      self.$images.each(function() { self._generateTiles( $(this) ) })

      // Remove from DOM to handle in slider
      self.$wraps = self.$container.find('.tiles-wrap').detach()
      self.$wraps.first().addClass('tiles-wrap-current').appendTo( self.$container )

      if ( o.nav ) {
        self._addNav()
        self.$navLinks = $('.tiles-nav a')
      }

      self._setupDescriptions()

      // Prevent css3 transitions on load
      $('body').addClass('tiles-preload')
      $( window ).load(function(){ $('body').removeClass('tiles-preload') })

      if ( o.auto ) { self.start() }

    },

    _addNav: function() {

      var self = this
        , o = self.opts
        // double-wrap in case a string is passed
        , $nav = $( o.navWrap || '<div/>' ).addClass('tiles-nav')
        , links = [], $links

      for ( var i = 1; i < self.$wraps.length + 1; i++ ) {
        links.push('<a href="#">'+ i +'</a>')
      }

      $links = $( links.join('') )

      // Events
      $links.click(function(e) {
        var $this = $(this)
          , idx = +$this.text() - 1
        self._updateNav()
        self._navigate( idx, $.noop )
        e.preventDefault()
      })
      $links.first().addClass('tiles-nav-active') // init

      // Insert in DOM
      if ( o.navWrap ) {
        $nav.append( $links )
      } else {
        self.$container.append( $nav.append( $links ) )
        // Adjust center
        $nav.css( 'margin-left', '-'+ $nav.outerWidth()/2 +'px' )
      }

    },

    _updateNav: function() {
      if ( this.interval ) { this.stop().start() }
      this.$navLinks.removeClass('tiles-nav-active')
        .eq( this._getCurrentIdx() ).addClass('tiles-nav-active')
    },

    _setupDescriptions: function() {
      this.$descriptions.addClass('tiles-description')
        .first().addClass('tiles-description-active')
    },

    _showOrHideDescription: function( toggle ) {
      this.$descriptions.removeClass('tiles-description-active')
        .eq( this._getCurrentIdx() ).toggleClass( 'tiles-description-active', toggle )
    },

    _generateTiles: function( $img ) {

      var self = this
        , o = self.opts
        , tiles = [], $tiles

      for ( var i = 0; i < self.n_tiles; i++ ) {
        tiles.push('<div class="tiles-tile '+ self.klassNormal +'"/>')
      }

      $tiles = $( tiles.join('') )

      $tiles.addClass('tiles-x'+ o.x +' tiles-y'+ o.y)
        .filter(':odd').addClass('tiles-odd').end()
        .filter(':even').addClass('tiles-even')

      $tiles.css({
        width: self.$container.width() / o.x,
        height: self.$container.height() / o.y,
        backgroundImage: 'url('+ $img.attr('src') +')'
      })

      // Insert in DOM
      $('<div class="tiles-wrap"/>').append( $tiles ).insertAfter( $img.hide() )

      // Calculate offset when image is in DOM
      $tiles.each(function(){
        var $this = $(this), pos = $this.position()
        $this.css('backgroundPosition', -pos.left +'px '+ -pos.top +'px')
      })

    },

    _animateTiles: function( $wrap, callback ) {

      callback = callback || $.noop

      var self = this
        , o = self.opts
        , range = Utils.range( 0, self.n_tiles, o.random )
        , delay = Math.floor( o.tileSpeed / self.n_tiles )
        , limit = range.length / ( 100/o.limit )
        , done = self.n_tiles > 1 ? o.tileSpeed + o.cssSpeed : o.cssSpeed
        , $tiles = $wrap.find('.tiles-tile')

      self.isAnimating = true

      if ( o.reverse ) { range = range.reverse() }

      if ( o.limit ) {
        o.reverse
          ? range.splice( 0, limit )
          : range.splice( limit, range.length )
      }

      range.forEach(function( tile, i ) {

        var theTile = $tiles.eq( tile )
          , theDelay = i * delay

        setTimeout(function() { theTile.addClass( self.klassAnim ) }, theDelay )

        if ( o.rewind ) {
          theDelay += o.cssSpeed / ( 100/o.rewind )
          setTimeout(function() { theTile.removeClass( self.klassAnim ) }, theDelay )
        }

      })

      // Callback
      setTimeout(function() {
        self.isAnimating = false
        callback()
      }, done )

    },

    _resetTiles: function( $wrap ) {
      $wrap.find('.tiles-tile').removeClass( this.klassAnim )
    },

    _getCurrentWrap: function() {
      return this.$wraps.filter('.tiles-wrap-current')
    },

    _getCurrentIdx: function() {
      return this.$wraps.index( this._getCurrentWrap() )
    },

    _navigate: function( idx, callback ) {

      var self = this
        , o = self.opts
        , $cur = self._getCurrentWrap()
        , $target = self.$wraps.eq( idx )

      if ( idx === self._getCurrentIdx() || self.isAnimating ) {
        return false
      }

      self.$container.find('.tiles-wrap').removeClass('tiles-wrap-current')
      $target.addClass('tiles-wrap-current').prependTo( self.$container )

      if ( o.fade ) {
        $target.fadeOut(1).fadeIn( o.tileSpeed )
      }

      if ( o.rewind ) {
        $cur.fadeIn(1).delay( o.tileSpeed/2 ).fadeOut( o.tileSpeed )
      }

      self._animateTiles( $cur, function() {
        $cur.remove()
        self._resetTiles( $cur )
        self._showOrHideDescription( true )
        callback()
        o.afterChange()
      })

      o.beforeChange()

      self._updateNav()
      self._showOrHideDescription( false )

      return this

    },

    // Public methods:

    prev: function( callback ) {

      var self = this
        , $cur = self._getCurrentWrap()
        , isFirst = $cur.is( self.$wraps.first() )
        , idx = isFirst ? self.$wraps.length - 1 : self._getCurrentIdx() - 1

      return this._navigate( idx, callback || $.noop )

    },

    next: function( callback ) {

      var self = this
        , $cur = self._getCurrentWrap()
        , isLast = $cur.is( self.$wraps.last() )
        , idx = isLast ? 0 : self._getCurrentIdx() + 1

      return this._navigate( idx, callback || $.noop )

    },

    start: function() {

      var self = this
        , o = self.opts
        , endLoop = ( o.slideSpeed * (self.$wraps.length-1) ) + o.tileSpeed

      if ( self.interval ) { self.stop().next() }

      self.interval = setInterval(function() {
        self.next() }, o.slideSpeed )

      if ( !o.loop ) {
        setTimeout(function(){ self.stop() }, endLoop );
      }

      return this

    },

    stop: function() {
      clearInterval( this.interval )
      this.interval = false
      return this
    }

  }

  // jQuery plugin:

  $.fn.tilesSlider = function( options ) {
    var args = Array.prototype.slice.call( arguments, 1 )
    return this.each(function() {
      if ( typeof options === 'string' ) {
        var plugin = $.data( this, 'tiles-slider' )
        plugin[ options ].apply( plugin, args )
      } else if ( !$.data(this, 'tiles-slider') ) {
        $.data( this, 'tiles-slider', new TilesSlider( this, options ) )
      }
    })
  }

}( jQuery, window ))
