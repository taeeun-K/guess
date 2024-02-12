
/*
 * Swipe 1.0
 *
 * Brad Birdsall, Prime
 * Copyright 2011, Licensed GPL & MIT
 *
*/
window.SwipeClient = function(element, options) {
    // return immediately if element doesn't exist
    if (! element) {
        return null;
    }

    var _this = this;

    // retreive options
    this.options = options || {};
    this.index = this.options.startSlide || 0;
    this.speed = this.options.speed || 300;
    this.callback = this.options.callback || function() {};
    this.delay = this.options.auto || 0;
    this.postback = this.options.postback || true;

    // 캐싱 사용유무 (기본값으로 이미 넘어오지만 그래도 no로 한번 더 저장)
    this.cache = this.options.cache || 'no';

    // 현재 슬라이드 개별 모듈의 순서(인덱스)를 저장하기 위해 저장 (상품번호, 카테코리 번호 등으로 조합된 상품별 유니크 값)
    this.storageId = this.options.elementId || '';

    // reference dom elements
    this.container = element;
    this.element = this.container.getElementsByTagName('ul')[0]; // the slide pane

    // static css
    this.container.style.overflow = 'hidden';
    this.element.style.listStyle = 'none';
    this.element.style.margin = 0;

    // trigger slider initialization
    this.setup();

    // begin auto slideshow
    this.begin();

    // add event listeners
    if (this.element.addEventListener) {
        this.element.addEventListener('touchstart', this, false);
        this.element.addEventListener('touchmove', this, false);
        this.element.addEventListener('touchend', this, false);
        this.element.addEventListener('touchcancel', this, false);
        this.element.addEventListener('webkitTransitionEnd', this, false);
        this.element.addEventListener('msTransitionEnd', this, false);
        this.element.addEventListener('oTransitionEnd', this, false);
        this.element.addEventListener('transitionend', this, false);

        window.addEventListener('resize', this, false);
    }
};

SwipeClient.prototype = {
    setup: function() {
        // get and measure amt of slides
        this.slides = this.element.children;
        this.length = this.slides.length;

        // return immediately if their are less than two slides
        if (this.length < 2) {
            return null;
        }

        // determine width of each slide
        this.width = Math.ceil(('getBoundingClientRect' in this.container) ? this.container.getBoundingClientRect().width : this.container.offsetWidth);

        // Fix width for Android WebView (i.e. PhoneGap)
        if (this.width === 0 && typeof window.getComputedStyle === 'function') {
            this.width = window.getComputedStyle(this.container, null).width.replace('px','');
        }

        // return immediately if measurement fails
        if (! this.width) {
            return null;
        }

        // hide slider element but keep positioning during setup
        var origVisibility = this.container.style.visibility;

        this.container.style.visibility = 'hidden';

        // dynamic css
        this.element.style.width = Math.ceil(this.slides.length * this.width) + 'px';

        var index = this.slides.length;

        while (index--) {
            var el = this.slides[index];

            el.style.width = this.width + 'px';
            el.style.display = 'table-cell';
            el.style.verticalAlign = 'top';
        }

        // set start position and force translate to remove initial flickering

        // 캐싱 사용중일 경우에만 처리
        if (this.cache === 'yes') {
            // 저장된 세선 스토리지 읽어와 처리
            // 각 스와이프의 개별 모듈에 해당되는 세션 스토리지 값
            // NaN 보다는 parseInt(null)로 명확하게 구분
            var iStorageIndexData = parseInt(null);

            // 상품 상세페이지에서 생성된 세션 스토리지 키
            var sStorageDetailName = 'sStorageDetail';

            // 상품 상세페이지에서 생성된 세션 스토리지 값 (Unix Timestamp)
            // NaN 보다는 parseInt(null)로 명확하게 구분
            var iStorageDetailData = parseInt(null);

            // 현재 시간 Unix Timstamp
            var iNowTime = Math.floor(new Date().getTime() / 1000);

            // 세션 스토리지 유지 시간
            var iSessionTime = 60 * 5;

            // 값 할당 (int)
            try {
                iStorageIndexData = parseInt(sessionStorage.getItem(this.storageId));
                iStorageDetailData = parseInt(sessionStorage.getItem(sStorageDetailName));
            } catch (e) {
            }

            // 저장된 값(추가 이미지)이 삭제된 경우 빈 페이지로 스와이프 되므로, 저장된 인덱스에 해당되는 이미지가 없는 경우는 세션 스토리지 삭제
            if (typeof($S.aButton[iStorageIndexData]) === 'undefined') {
                // 할당된 값 초기화
                iStorageIndexData = parseInt(null);

                // 실제 세션 스토리지에서도 삭제
                try {
                    sessionStorage.removeItem(this.storageId);
                } catch (e) {
                }
            }

            // 값이 있다면 moveTab을 해야 Circle(페이징 원)까지 변경됨
            // 상세페이지에서 생성된 세션 스토리지가 특정 시간이 경과하지 않은 경우에만 처리
            // 만약 모듈에서 상품번호 등의 정보(this.storageId)를 가져오지 못한 경우에는 처리하지 않음
            if (this.storageId !== '' && isNaN(iStorageIndexData) === false && isNaN(iStorageDetailData) === false && iStorageDetailData + iSessionTime >= iNowTime) {
                // 실제 이동 처리
                this.moveTab(iStorageIndexData, 0);
            } else {
                this.slide(this.index, 0);
            }
        } else {
            this.slide(this.index, 0);
        }

        this.container.style.visibility = origVisibility;
    },

    slide: function(index, duration) {
        // if useing ajax load
        try {
            if (oMobileSliderData.sPictorialLoad === true) {
                if ($S.iAjax === index + 1 && $S.bAjax === true) {
                    $S.callAjax();
                }
            }
        } catch (e) {}

        var style = this.element.style;

        // fallback to default speed
        if (duration == undefined) {
          duration = this.speed;
        }

        // set duration speed (0 represents 1-to-1 scrolling)
        style.webkitTransitionDuration = style.MozTransitionDuration = style.msTransitionDuration = style.OTransitionDuration = style.transitionDuration = duration + 'ms';

        // translate to given index position
        style.MozTransform = style.webkitTransform = 'translate3d(' + -(index * this.width) + 'px, 0, 0)';
        style.msTransform = style.OTransform = 'translateX(' + -(index * this.width) + 'px)';

        // set new index to allow for expression arguments
        this.index = index;

        // 현재 모듈의 인덱스를 세선 스토리지에 저장
        // 캐시 사용중이며 인덱스가 있으면서 저장할 스토리지 ID 값이 있는 경우에만 처리
        if (this.cache === 'yes' && isNaN(this.index) === false && this.storageId !== '') {
            try {
                sessionStorage.setItem(this.storageId, this.index);
            } catch (e) {
            }
        }
    },

    getPos: function() {
        // return current index position
        return this.index;
    },

    prev: function(delay, postback) {
        // cancel next scheduled automatic transition, if any
        this.delay = delay || 0;
        this.postback = (postback == undefined) ? true : postback;

        clearTimeout(this.interval);

        if (this.index) {
            this.slide(this.index - 1, this.speed);
        } else {
            if (this.postback !== false) {
                this.slide(this.length - 1, this.speed); //if first slide return to end
            }
        }
    },

    next: function(delay, postback) {
        // cancel next scheduled automatic transition, if any
        this.delay = delay || 0;
        this.postback = (postback == undefined) ? true : postback;

        clearTimeout(this.interval);

        if (this.index < this.length - 1) {
            this.slide(this.index + 1, this.speed);
        } else {
            if (this.postback !== false) {
                this.slide(0, this.speed); //if last slide return to start
            }
        }
    },

    moveTab: function(iPage, delay, oTarget) {
        // control current tab action
        // 모바일 상품상세에서 slide영역을 다시 원복함
        this.index = iPage;
        this.delay = delay || 0;

        clearTimeout(this.interval);

        this.slide(this.index, this.speed);

        if (typeof CAFE24.SHOP_FRONT_NEW_OPTION_EXTRA_IMAGE !== 'undefined') {
            CAFE24.SHOP_FRONT_NEW_OPTION_EXTRA_IMAGE.setSwipeImage('', true, iPage, oTarget);
        }
    },

    begin: function() {
        var _this = this;

        this.interval = (this.delay) ? setTimeout(function() {
            _this.next(_this.delay);
        }, this.delay) : 0;
    },

    stop: function() {
      this.delay = 0;

      clearTimeout(this.interval);
    },

    resume: function() {
      this.delay = this.options.auto || 0;
      this.begin();
    },

    setLength: function(expand) {
        this.length = expand;
    },

    handleEvent: function(e) {
        switch (e.type) {
            case 'touchstart':
                this.onTouchStart(e);
                break;
            case 'touchmove':
                this.onTouchMove(e);
                break;
            case 'touchcancel':
            case 'touchend':
                this.onTouchEnd(e);
                break;
            case 'webkitTransitionEnd':
            case 'msTransitionEnd':
            case 'oTransitionEnd':
            case 'transitionend':
                this.transitionEnd(e);
                break;
            case 'resize':
                this.setup();
                break;
        }
    },

    transitionEnd: function(e) {
      if (this.delay) {
          this.begin();
      }

      this.callback(e, this.index, this.slides[this.index], this);
    },

    onTouchStart: function(e) {
        this.start = {
          // get touch coordinates for delta calculations in onTouchMove
          pageX: e.touches[0].pageX,
          pageY: e.touches[0].pageY,

          // set initial timestamp of touch sequence
          time: Number(new Date())
        };

        // used for testing first onTouchMove event
        this.isScrolling = undefined;

        // reset deltaX
        this.deltaX = 0;

        // set transition time to 0 for 1-to-1 touch movement
        this.element.style.MozTransitionDuration = this.element.style.webkitTransitionDuration = 0;

        e.stopPropagation();
    },

    onTouchMove: function(e) {
        // ensure swiping with one touch and not pinching
        if (e.touches.length > 1 || e.scale && e.scale !== 1) {
            return;
        }

        this.deltaX = e.touches[0].pageX - this.start.pageX;

        // determine if scrolling test has run - one time test
        if (typeof this.isScrolling === 'undefined') {
            this.isScrolling = !! (this.isScrolling || Math.abs(this.deltaX) < Math.abs(e.touches[0].pageY - this.start.pageY));
        }

        // if user is not trying to scroll vertically
        if (! this.isScrolling) {
            // prevent native scrolling
            e.preventDefault();

            // cancel slideshow
            clearTimeout(this.interval);

            // increase resistance if first or last slide
            this.deltaX =
            this.deltaX /
            ((! this.index && this.deltaX > 0 // if first slide and sliding left
            || this.index == this.length - 1 // or if last slide and sliding right
            && this.deltaX < 0 // and if sliding at all
            ) ?
            (Math.abs(this.deltaX) / this.width + 1) // determine resistance level
            : 1); // no resistance if false

            // translate immediately 1-to-1
            this.element.style.MozTransform = this.element.style.webkitTransform = 'translate3d(' + (this.deltaX - this.index * this.width) + 'px,0,0)';

            e.stopPropagation();
        }
    },

    onTouchEnd: function(e) {
        // determine if slide attempt triggers next/prev slide
        var isValidSlide =
            Number(new Date()) - this.start.time < 250 // if slide duration is less than 250ms
            && Math.abs(this.deltaX) > 20 // and if slide amt is greater than 20px
            || Math.abs(this.deltaX) > this.width/2, // or if slide amt is greater than half the width

        // determine if slide attempt is past start and end
        isPastBounds =
            ! this.index && this.deltaX > 0 // if first slide and slide amt is greater than 0
            || this.index == this.length - 1 && this.deltaX < 0; // or if last slide and slide amt is less than 0

        // if not scrolling vertically
        if (! this.isScrolling) {
            // call slide function with slide end value based on isValidSlide and isPastBounds tests
            this.slide(this.index + (isValidSlide && ! isPastBounds ? (this.deltaX < 0 ? 1 : -1) : 0), this.speed);
        }

        e.stopPropagation();
    }
};


/**
 * Get the value of a cookie with the given name.
 *
 * @example $.cookie('the_cookie');
 * @desc Get the value of a cookie.
 *
 * @param String name The name of the cookie.
 * @return The value of the cookie.
 * @type String
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */
jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options = $.extend({}, options); // clone object since it's unexpected behavior if the expired property were changed
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // NOTE Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};
// JQuery URL Parser plugin - https://github.com/allmarkedup/jQuery-URL-Parser
// Written by Mark Perkins, mark@allmarkedup.com
// License: http://unlicense.org/ (i.e. do what you want with it!)

