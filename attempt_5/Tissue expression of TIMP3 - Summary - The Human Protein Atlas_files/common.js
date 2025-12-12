/* globals Cookies, ga, $ */
$(function() {
	var h_footer = $('.page_footer').height();	
	// Menu scroll fix - save original data
	$('.menufix').each(function() {
		$(this).data('original_css', {'top':$(this).css('top'), 'left':$(this).css('left'), 'position':$(this).css('position')});
		$(this).data('original_top', $(this).offset().top);
		$(this).data('scrl_offset', 0);
	});
	
	$(window).on("resize", function(e) {
		scroll_legend(e);
	}).trigger("resize");
	$(document).on("scroll", function(e) {
		scroll_legend(e);
	});
	function scroll_legend(e) {
		$('.menufix').each(function() {
			// dont fix anything if menu is longer than space available on page
			if ($(this).height() + $(this).data('original_top') > window.innerHeight) {
				$(this).css($(this).data('original_css'));
				return;
			}
			var lft, tp;
			if ($(this).hasClass('menu')) {	// gene pages
				lft = $(this).parent().offset().left;
				var nav_height = $('.atlas_nav.show_small').length? $('.atlas_nav.show_small').height() : 0;
				var atlas_header = $('.atlas_header');
				tp = tp = $('.page_header').height() + nav_height + Math.max((atlas_header.length ? atlas_header.offset().top : 0) - $(window).scrollTop(), 0) + 31;
			}
			else if ($(this).hasClass('blog_legend')) {	// news pages
				lft = $(this).parent().offset().left - 15;
				tp = $('.page_header ').height() - 0;
			}
			else {	// about pages
				lft = $(this).parent().offset().left - $(this).width() - 19;
				tp = $('.page_header ').height() + 40;
			}
			// Move menu up if it covers the footer
			if ($(this).height() + tp > $('.page_footer').offset().top  - $(window).scrollTop()) {
				tp = $('.page_footer').offset().top - $(window).scrollTop() - $(this).height() - 10;
			}
			$(this).css({'position':'fixed', 'left':lft, 'top':tp});
		});
	}

	// Activate jQuery tooltip function for title tags ##
	initUITooltip();

	// Activate colorbox links
	$(window).on('hashchange', function(e) {
		if (e.originalEvent && e.originalEvent.oldURL.indexOf('#cbox') !== -1) {
			$.colorbox.close();
		}
	});
	$(document).on("cbox_open", function() {
		window.location.hash = '#cbox';
	});
	$(document).on("cbox_closed", function() {
		if (window.location.hash === '#cbox') {
			window.history.back();
		}
	});
	$(document).on("cbox_complete", function() {
		if ($("#cboxTitle").height() > 22) {
			// Adjust for long texts
			$("#cboxTitle").hide();
			$("#cboxLoadedContent").prepend($("#cboxTitle").html()).css({'background-color':'#fff'}).find('.cboxPhoto').css({'border':'1px solid #000', 'width':'99%', 'height':'auto'});
			$.colorbox.resize();
		}
		var $video = $(this).find('video');
		if ($video.length) {
			$video[0].play();
		}
	});
	$(document).on('click', '.colorbox', function() {
		var options = {
			opacity: 0.9,
			open: true,
			title: $(this).attr('text'),
			href: $(this).attr('href'),
		};
		if ($(this).attr('data-cboxWidth')) {
			options.width = $(this).attr('data-cboxWidth');
		}
		if ($(this).attr('data-cboxHeight')) {
			options.height = $(this).attr('data-cboxHeight');
		}
		if ($(this).attr('data-cboxInnerWidth')) {
			options.innerWidth = $(this).attr('data-cboxInnerWidth');
		}
		if ($(this).attr('data-cboxInnerHeight')) {
			options.innerHeight = $(this).attr('data-cboxInnerHeight');
		}
		if ($(this).attr('data-cboxScalePhotos')) {
			options.scalePhotos = true;
			options.photo = true;
		}
		if ($(this).attr('data-cboxInline') || $(this).attr('href').indexOf('#')===0) {
			options.inline = true;
		} else if ($(this).attr('data-cboxIframe')) {
			options.iframe = true;
		} else if ($(this).attr('data-cboxPhoto')) {
			options.photo = true;
		}
		$.colorbox(options);
		return false;
	});
	
	// Show hide
	$('a.show_hide').on("click", function() {
		$('tr.'+$(this).attr('href').replace('#', '')).toggle();
		$(this).toggleClass('hide');
		return false;
	}).filter(':first').trigger("click");
	// Init tabs
	$('div.tabs span.tab div span').on("click", function() {
		var $th = $(this).closest('th');
		var $tab = $(this).closest('span.tab');
		$th.find('span.tab.selected').removeClass('selected');
		$tab.addClass('selected');
		$th.find('.tab_content').addClass('hidden');
		var tab_content = $th.find("#"+$tab.attr('name'));
		tab_content.removeClass('hidden');
		var tabs = $(this).closest('div.tabs');
		if (tabs.data('switchFunc') && typeof window[tabs.data('switchFunc')] != "undefined") {
			window[tabs.data('switchFunc')](this, tab_content.get(0));
		}
	});
	$('div.tabs').each(function() {
		var t = $(this).find('.tab.selected div span');
		if (!t.length) {
			t = $(this).find('span.tab:first-child div span');
		}
		t.trigger("click");
	});
	$('a.tab_scroll_left, a.tab_scroll_right').on("mousedown", function() {
		var $tabs = $(this).closest('table').find('div.tabs');
		var delta = $(this).hasClass('tab_scroll_left')? -150 : 150;
		var scrl = function() {
			var pos = $tabs.scrollLeft() + delta;
			$tabs.stop().animate({scrollLeft:pos}, 300);
    };
		scrl();
		$(this).data('scrl', setInterval(scrl, 300));
		return false;
	}).on("mouseup", function() {
		clearInterval($(this).data('scrl'));
		return false;
	}).on("click", function() {return false;});
	
	/* load alt movie if youtube blocked */
	$(window).on("load", function () {
		$('.youtubevideo').each(function() {
			var image = new Image();
			var video = $(this);
			image.onerror = function(){
				video.attr('src', video.attr('alt'));
			};
			image.src = "https://youtube.com/favicon.ico?_=" + Date.now();
		});
	});
	
	// Tissue menu for atlas pages
	$("div#sidemenu .tissue_menu_opener").on("click", function(e) {
		var menu = $($(this).attr('href')+".tissue_menu");
		if (menu.is(":visible")) menu.hide();
		else menu.show();
		e.preventDefault();
		return false;
	});
	$(document).on("keyup", function(e) {
		// esc
		if (e.keyCode === 27) {
			$(".tissue_menu").hide();
		}
	});
	$(document).on("mouseup", function(e) {
		var container = $("#tissue_menu");
		var openlink = $("div#sidemenu .tissue_menu_opener");
		if (!(container.has(e.target).length || container.is(e.target)) && !(openlink.has(e.target).length || openlink.is(e.target))) {
			$(".tissue_menu").hide();
		}
	});
	function toggleTissueMenu(hide) {
		if (hide || typeof hide === "undefined") {
			$(".tissue_menu").hide();
		} else {
			$("#tissue_menu").show();
		}
	}
});

addListener('load', init, window);
function init() {
	trRegister();
}

/* Tooltip wrappers (for old tooltip content, e.g. transcript image) */
$(function() {
	$('[onmouseover^=tooltip]').tooltip({
		track: true,
		tooltipClass: "tooltip",
		items: 'area',
		content: function() {
			return $(this).attr('onmouseover').replace(/tooltip\('(.*)'[^)]*\);/,  function(match, $1, $2, offset, original) { return $1; });
		},
	});
});
function tooltip(tip) {}
function exit() {}

function initUITooltip() {
	$(document).tooltip({
		track: true,
		classes: {
			"ui-tooltip": "tooltip commontooltip"
		},
		items: '[title]',
		content: function() {
			$(document).data('tooltip', $(this));
			return $(this).attr('title');
		},
		open: function (e, ui) {
			var fs_el = fullscreen_element();
			if (fs_el) {
				ui.tooltip.appendTo($(fs_el));
			}
			var tooltip = $(document).data('tooltip');
			tooltip.off('click', removeUITooltip);
			tooltip.on('click', removeUITooltip);
		},
		close: function (e, ui) {
			var tooltip = $(document).data('tooltip');
			removeUITooltip();
			tooltip.off('click', removeUITooltip);
		}
	});
}
function removeUITooltip() {
	$('.ui-tooltip.commontooltip').remove();
}

function fullscreen_element() {
	if (document.fullscreenElement) return document.fullscreenElement;
	if (document.webkitFullscreenElement) return document.webkitFullscreenElement;
	if (document.mozFullScreenElement) return document.mozFullScreenElement;
	return null;
}

//###########
//## TR hover
function trRegister(rootElement) {
	if (typeof rootElement === 'undefined') {
		rootElement = document;
	}
	var tbody = rootElement.getElementsByTagName('TBODY');
	for (var i=0; i<tbody.length; i++) {
		if (tbody[i].classList.contains('hover') || tbody[i].classList.contains('hover_rowspan')) {
			var tr = tbody[i].getElementsByTagName('TR');
			for (var j=0; j<tr.length; j++) {
				if (!tr[j].classList.contains('nohover')) {
					if (!tbody[i].classList.contains('hovernoclick')) {
						addListener('click', trClick, tr[j]);
					}
					addListener('mouseover', trOver, tr[j]);
					addListener('mouseout', trOut, tr[j]);
				}
			}
		}
	}
}
function getTr(e) {
	var trgt = eventTarget(e);
	while (trgt.tagName != 'TR') {
		trgt = trgt.parentNode;
	}
	return trgt;
}
function trClick(e) {
	//tempfix
	if (eventTarget(e) && typeof eventTarget(e).className == 'string' && eventTarget(e).className.indexOf('onpage_link') > -1 ) {
		return;
	}
	if (eventTarget(e) && eventTarget(e).tagName == 'A') {
		return;
	}
	
	// "Normalize" cross-browser mouse click event, below IE specific
	if (!e.which && e.button) {
		e.which = 0;
		if (e.button & 4) {
			e.which = 2;
		}
	}
  // Click link in current td if exists	
	var td_a = eventTarget(e).getElementsByTagName('A');
	if (td_a[0]) {
		//if class='roi_link' or 'organ_link', click link
		if (td_a[0].className.indexOf('roi_link') > -1 || td_a[0].className.indexOf('organ_link') > -1 || td_a[0].className.indexOf('onpage_link') > -1 ) {
			td_a[0].click();
		} else {
			if (e.ctrlKey || e.shiftKey || e.metaKey || e.which==2)  {
				window.open(td_a[0].href, '_blank');
			} else {
				document.location.href = td_a[0].href;
			}
		}
		trOut(e);
	}
	else {
		// Else find first td with link
		var tr_a = getTr(e).getElementsByTagName('A');
		if (tr_a.length) {
			var i = 0;
			while (tr_a[i] && (" " + tr_a[i].className + " ").indexOf(" no_tr_click ") > -1) {
				i++;
			}
			if (tr_a[i]!='') {
				if (tr_a[i].className.indexOf('roi_link') > -1 || tr_a[i].className.indexOf('organ_link') > -1) {
					tr_a[i].click();
				} else {
					if (e.ctrlKey || e.shiftKey || e.metaKey || e.which==2) {
						window.open(tr_a[i].href, '_blank');
					} else {
						document.location.href = tr_a[i].href;
					}
				}
			}
			trOut(e);
		}
	}
	e.preventDefault();
}
function trOver(e) {
	getTr(e).className += ' hover';
}
function trOut(e) {
	getTr(e).className = getTr(e).className.replace(/\shover/i, "");
}

//##########
//## Getters
function getElement(id) {
	if (document.getElementById) {
		var elem = document.getElementById(id);
		// Verify id attibute if IE
		if (elem && navigator.userAgent.match(/msie/i)) {
			//alert(elem);
			if (elem.attributes['id'].value == id) {
				return elem;
			} else {
				return getElementAll(id);
			}
		}
		return elem;
	} else {
		return getElementAll(id);
	}
}
function getElementAll(id) {
	for (var i=1; i<document.all[id].length; i++) {
		if (document.all[id][i].attributes['id'].value == id) {
			return document.all[id][i];
		}
	}
	return null;
}

// cookie statement
$(function() {
	$('#cookie_statement a.cookie_statement').on("click", function() {
		setCookie('cookie_statement', 1);
		$(this).closest('div').slideToggle('fast');
		return false;
	});
});

function setCookie(name, val, options) {
	var cookieOptions = {path:'/'};
	
	// Handle expires
	var allowed = false;
	var defaultExpires = 14;
	if (name === 'cookie_statement') {
		allowed = true;
		cookieOptions.expires = 365;
	} else if (Cookies.get('cookie_statement')) {
		allowed = true;
	}
	if (typeof options !== "undefined" && typeof options.expires === "undefined") {
		// If expires is set and not 0
		if (options.expires === 0 || allowed === false) {
			// Session cookie
		} else if (options.expires > 0) {
			cookieOptions.expires = options.expires;
		}
	} else if (allowed) {
		cookieOptions.expires = defaultExpires;
	}
	
	Cookies.set(name, val, cookieOptions);
}
function getCookie(name) {
	return Cookies.set(name);
}
function removeCookie(name) {
	Cookies.remove(name);
}

//##################
//## Event functions

function eventTarget(e) {
	var evt = e || window.event;
	var trgt = evt.target? evt.target : evt.srcElement;
	return trgt;
}

function addListener(evt, func, node) {
	if (!node) {
		node = document;
	}
	if (node.addEventListener) {
		node.addEventListener(evt, func, true);
	} else if (node.attachEvent) {
		node.attachEvent("on"+evt, func);
	}
}
function removeListener(evt, func, node) {
	if (!node) {
		node = document;
	}
	if (node.removeEventListener) {
    node.removeEventListener(evt, func, true);
  }
	else if (node.detachEvent) {
    node.detachEvent("on"+evt, func);
  }
}

function cancelDefault(e) {
	var evt = e || window.event;
	if (evt.preventDefault) {
		evt.preventDefault();
	}
	else {
		evt.cancelBubble = true;
		evt.returnValue = false;
		document.onselectstart = new Function('return false');
	}
}


function ga_event(event, eventData) {
	gtag('event', event, eventData);
}

//##################
//## Prototype funcs
String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, "");
};
if (!Array.prototype.find) {
	Array.prototype.find = function(callback) {
		if (this === null) {
			throw new TypeError('Array.prototype.find called on null or undefined');
		} else if (typeof callback !== 'function') {
			throw new TypeError('callback must be a function');
		}
		var list = Object(this);
		// Makes sures is always has an positive integer as length.
		var length = list.length >>> 0;
		var thisArg = arguments[1];
		for (var i = 0; i < length; i++) {
			var element = list[i];
			if (callback.call(thisArg, element, i, list)) {
				return element;
			}
		}
	};
}

if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(elt /*, from*/)
  {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0)
         ? Math.ceil(from)
         : Math.floor(from);
    if (from < 0) {
      from += len;
    }
    for (; from < len; from++)
    {
      if (from in this && this[from] === elt) {
	      return from;
      }
    }
    return -1;
  };
}

/* Table sorting/float header */
if ($.tablesorter) {
	$.tablesorter.addParser({
		// set a unique id
		id: 'sortAttribute',
		is: function(s) {
			// return false so this parser is not auto detected
			return false;
		},
		format: function(value, table, cell) {
			// format your data for normalization
			return cell.getAttribute('sort');
		}/*,
		// set type, either numeric or text
		type: 'date'*/
	});
}
$.fn.HPAtablesorter = function() {
	if (!$(this).find('tbody tr').length) {
		return $(this); // Do not sort empty tables
	}
	var wdgt = new Array();
	var wdgtOpts = new Object();
	var hdrs = new Object();
	var sort = new Array();
	if ($(this).hasClass('zebra')) {
		wdgt.push('zebra');
	}
	if ($(this).hasClass('saveSort')) {
		wdgt.push('saveSort');
	}
	if ($(this).hasClass('floatheader')) {
		wdgt.push('stickyHeaders');
		wdgtOpts.stickyHeaders_offset = $(this).attr('stickyHeaders_offset')? $(this).attr('stickyHeaders_offset') : $('.page_header');
	}
	if ($(this).hasClass('filter')) {
		wdgt.push('filter');
		if ($(this).attr('filter_functions')) {
			wdgtOpts.filter_functions = eval($(this).attr('filter_functions'));
		}
	}
	// no sort
	var nosort = $(this).hasClass('sortable')? '.nosort' : '';
	$(this).find('thead tr th'+nosort).each(function() {
		hdrs[$(this).prevAll().length] = {sorter:false};
	});
	// sort attribute
	$(this).find('tbody tr:first-child td[sort]').each(function() {
		hdrs[$(this).prevAll().length] = {sorter:'sortAttribute'};
	});
	// initial sorting
	$(this).find('thead th.sort').each(function(i) {
		sort.push([$(this).prevAll().length, $(this).hasClass('desc')? 1:0]);
	});
	$(this).tablesorter({
		widgets: wdgt,
		headers: hdrs,
		sortList: sort,
		widgetOptions: wdgtOpts,
		cancelSelection: false,
	});
	return $(this);
};

$(function() {
	/* Table sorting/float header */
	$('table.sortable, table.zebra, table.floatheader').HPAtablesorter();
	/* Organ links */
	$(".organ_link").on('click', function() {
		var $pop = $(this).closest('tr').next('tr').find('div.tissuepop');
		$("div.tissuepop.selected").not($pop).removeClass("selected").slideFadeToggle();
		$pop.toggleClass("selected").slideFadeToggle();
		return false;
	});
		
	/* SlideToggle */
	$('body').on('click', 'div.slideToggle div', function() {
		if ($(this).hasClass('active')) {
			return;
		}
		$(this).siblings().removeClass('active');
		$(this).addClass('active').trigger('change');
	});
	
	$('.text_overflow').each(function() {
		if ($(this)[0].scrollHeight > parseInt($(this).height())+1) {
			$(this).data('originalHeight', $(this).height()).find('.text_fader, .text_fader_show').show();
		} else if ($(this)[0].scrollHeight == 0) {
			//always show button in this case and use css:max-height instead since text is hidden
			$(this).data('originalHeight', $(this).css('max-height')).find('.text_fader, .text_fader_show').show();
		}
	});
	$('.text_fader_show').on("click", function() {
		var $box = $(this).closest('.text_overflow');
		if ($(this).text() == 'Show all') {
			$box.animate({'max-height':($box[0].scrollHeight), 'padding-bottom':18}, 'fast').find('.text_fader').hide();
			$(this).text('Show less');
		} else {
			$box.animate({'max-height':$box.data('originalHeight'), 'padding-bottom':0}, 'fast').find('.text_fader').show();
			$(this).text('Show all');
		}
	});
	/* Table row toggle */
	$('body').on('click', '.show_hidden', function() {
			var $tbody = $(this).closest('table').find('tbody:first');
			if (!$(this).data('shown')) {
				$(this).data('shown', $tbody.find('tr:visible').length-1);
			}
			if ($(this).hasClass('show')) {
				$(this).removeClass('show');
				$tbody.find('tr:gt('+$(this).data('shown')+')').not($(this).closest('tr')).addClass('hidden');
				$(document).scrollTop($(this).closest('table').offset().top-110);
			} else {
				$(this).addClass('show');
				$tbody.find('tr').removeClass('hidden');
			}
			$(this).closest('table').trigger('update', [ true ]);
	});
	
	initItext();

	var loc_hash = window.location.hash;
	$("#sidemenu span a").each(function() {
		var hasharr = $(this).attr("href").match("#(.*)");
		if (hasharr && hasharr.length) {
			var hash = hasharr[0];
			if (hash == loc_hash || (loc_hash == "" && hash == "#top")) {
				sideMenu(hash.replace('#', ''));
			}
			$(hash).not('.tissue_menu').addClass("menutarget");
		}
	});
	$(window).on('scroll', (function() {
		var offset = 10;
		var lastMenuId = $('.menutarget').last().attr('id');
		return function() {
			var id;
			$('.menutarget').each(function() {
				if ($(window).scrollTop()+offset >= $(this).offset().top) {
					id = $(this).attr('id');
				}
			});
			// set last if scrolled down to the bottom
			if ($(window).scrollTop() + $(window).height() >= ($(document).height()-1)) {
				id = lastMenuId;
			}
			sideMenu(id);
		};
	})()).trigger('scroll');
	
	function sideMenu(id) {
		if (typeof id != 'undefined' && $('#sidemenu').data('id') != id) {
			$('#sidemenu').data('id', id).find('span').removeClass('active').find('a[href*="#'+ id +'"]').closest("span").addClass('active');
		}
	}
});
var itextinited = false;
/*I-texts*/
function initItext(el) {
	if (typeof el === 'undefined') {
		el = document;
	}
	$(el).find('.hastip').tooltip({
		position: { my: "left top+15", at: "left bottom", collision: "none" },
		disabled: true,
		classes: {"ui-tooltip": "hastip tooltip"},
		items: '.hastip',
		content: function() {
			return $("#help_"+$(this).data('helpid')).html();
		},
		close: function() {
			$(this).tooltip('disable');
		},
		open: function() {
			console.log('open called');
			var $el = $(this);
			var id = $el.data('helpid');
			var name = $el.text().slice(0, -1);
			ga_event('help', {'element':id+' '+name});
			$(document).on('click', function(e) {
				if (!$el.is(e.target) && !$el.has(e.target).length && !$(e.target).hasClass('ui-tooltip-content')) {
					$el.tooltip('close');
				}
			});
			$(document).on("keyup", function(e) {
				if (e.which == 27) {
					$el.tooltip('close');
				}
			});
			$(".tooltip a.help_edit").on("click", function() {
				if (!itextinited) {
					window.addEventListener('message', function(event) {
						if (event.origin.match(/http(s)*:\/\/[a-z.]+proteinatlas\.org/)) {
							if (event.data.response === 'term_saved' || event.data.response === 'term_discarded' || event.data.response === 'term_locked') {
								document.location.reload();
							} else {
								var helpDiv = $("#help_" + event.data.term_id);
								helpDiv.find(".helpText").html(event.data.text);
								helpDiv.find(".helpURL").attr('href', event.data.url);
								$("#"+$el.data('uiTooltipId')+" .helpText").html(event.data.text);
								$("#"+$el.data('uiTooltipId')+" .helpURL").attr('href', event.data.url);
							}
						}
					});
					itextinited = true;
				}
				window.open($(this).attr('data-link'), 'editHelpText', 'width=1000,height=700,resizable=1,scrollbars=1');
				return false;
			});
		},
	}).on('click', function (e) {
		$(this).tooltip('enable').tooltip('open').off("focusout mouseleave mouseenter");
		e.preventDefault();
	});
}

function goToPrest(id) {
	if (document.location.href.indexOf('/antibody') == -1) {
		document.location.href = document.location.href.replace(document.location.hash,"")+'/antibody';
	}
}

function getHighlightColor(color) {
	var r = color.match(/(\d+),\s*(\d+),\s*(\d+)/i);
	for (var i = 1; i < 4; i++) {
		r[i] = Math.round(r[i] * 1.2);
	}
	return r;
}
$.fn.slideFadeToggle = function(easing, callback) {
    return this.animate({ opacity: 'toggle', height: 'toggle' }, "fast", easing, callback);
};

String.prototype.ucfirst = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

// Polyfill like function for history.replaceState()
(function(namespace) { // Closure to protect local variable "var hash"
	if ('replaceState' in history) { // Yay, supported!
		namespace.replaceHash = function(newhash) {
			if (('' + newhash).charAt(0) !== '#') {
				newhash = '#' + newhash;
			}
			history.replaceState('', '', newhash);
		};
	} else {
		var hash = location.hash;
		namespace.replaceHash = function(newhash) {
			if (location.hash !== hash) {
				history.back();
			}
			location.hash = newhash;
		};
	}
}(history));
