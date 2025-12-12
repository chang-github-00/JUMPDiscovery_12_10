/* globals $ */
//Translates for instance #imid_3 to opening particular image by id. _image1 is for opening the first image and #img to close the image.
$(function() {
	var imid_regex = new RegExp('^\#imid\_[0-9]+$');
	var image_regex = new RegExp('^#image_([0-9]+_[A-Z][0-9]+_[0-9]+)$');
	var match = image_regex.exec(document.location.hash);
	if (match) {
		var imagePath = match[1];
		var imid = $('img[data-basepath$="' + imagePath + '"]').attr('data-name');
		history.replaceState(undefined, undefined, '#imid_' + imid);
	}
	if (document.location.hash.indexOf('#img') == 0) {
		history.replaceState(undefined, undefined, "#");
	} else if (imid_regex.test(document.location.hash)) {
		$('.'+document.location.hash.replace('#', '')).trigger("click");
	} else if (document.location.hash.indexOf('#image1') == 0) {
		$('.imid').first().trigger("click");
	}
	$(document).on('click', '.channel_button', function() {
		var $container = $(this).closest('.cellImages, .multiplexImages, #seadragon');
		if ($container.find('.lut_button').length && !$container.find('.lut_button').hasClass('channel_inactive')) {
			$container.find('.channel_button').not($(this)).addClass('channel_inactive');
		}
		$(this).toggleClass('channel_inactive').trigger('blur');
		$container.toggleChannel(true);
	});
});

//## Normal image
function imageLoad(el, assayId, imgId, geneId, queryString, zindex) {
	ga_event('image', {'element':'assay_id='+assayId+'&image_id='+imgId});
	queryString = queryString? queryString : '';
	var activeChannels = '';
	var segm = '';
	OsViewer = seadragon();
	let channels;
	if ($(el).attr("data-channels")) {
		channels = $(el).attr("data-channels");
	} else {
		channels = $(el).find('img[data-channels]').attr("data-channels")
	}
	$(OsViewer.element).attr("data-channels", channels);
	if (typeof $(el).getActiveChannels == 'function') {
		$container = $(el).closest('.cellImages, #seadragon, .multiplexImages');
		activeChannels = '&active_channels=' + $container.getActiveChannels();
		var segmButton = $container.find('.segm_button');
		if (segmButton.length) {
			segm = '&segm=' + (segmButton.hasClass('channel_inactive')? 0:1);
		}
	}
	$.get('/image.php?assay_id='+assayId+'&image_id='+imgId+'&gene_id='+geneId+'&zindex='+zindex+queryString+activeChannels+segm, function(data) {
		if (data.meta) {
			$meta = $('#seadragon_meta');
			$meta.html(data.meta).css('max-height', $(window).height() - parseInt($meta.css('top')) - 30);
			if (data.stack_images) {
				$meta.get(0).stackData = data.stack_images;
			}
		}
		if (data.thumbs) {
			$('#seadragon_thumbs').html(data.thumbs);
			$('img.segm_image').trigger('toggle_segm_image');
		}
		if (data.src) {
			$('#seadragon').trigger('fullScreen', [true]);
			OsViewer.open({
				type: 'image',
				url:  data.src
			});
		}
		if (data.clss) {
			$(OsViewer.element).removeClass('seadragon-light seadragon-dark').addClass(data.clss);
		}
		if (data.basepath) {
			$(OsViewer.element).attr('data-basepath', data.basepath);
			if (data.selections) {
				OsViewer.imageSelections[data.basepath] = data.selections;
				var selections = data.selections;
				OsViewer.addOnceHandler('open', function() {
					for (let i in selections) {
						var selection = selections[i];
						if (selection.move_to_region) {
							setTimeout(function() {move_to_region(selection.x, selection.y, selection.width, selection.height, OsViewer, null, selection.rotation, 200);}, 100);
						}
					}
				});
			}
		}
		if (typeof data.scale != 'undefined') {
			OsViewer.scalebar({
				pixelsPerMeter: data.scale,
				color: data.scale_color,
				fontColor: data.scale_color,
				minWidth: '50px'
			});
		}
		if (data.overlay) {
			$('#seadragon_overlay').html(data.overlay).find('img').on('load', function() {
				$(this).data('width', this.width);
				$(this).data('height', this.height);
			});
		}
	}, 'json');
	return false;
}

function seadragon() {
	var OsViewer;
	if (OsViewer = $('#seadragon').data('OsViewer')) return OsViewer;
	$('<div id="seadragon"><div id="seadragon_meta"></div><div id="seadragon_thumbs"></div><div id="seadragon_overlay"></div></div>').appendTo($('body'));
	OsViewer = OpenSeadragon({
		prefixUrl: "/images_static/",
		preserveViewport: true,
		showHomeControl: true,
		mouseNavEnabled: true,
		showZoomControl: true,
		showFullPageControl: false,
		navigatorPosition: 'ABSOLUTE',
		navigatorTop: 50,
		navigatorLeft: 10,
		navigatorHeight: 130,
		navigatorWidth: 130,
		showNavigator: true,
		navigatorSizeRatio: 0.1,
		navigatorMaintainSizeRatio: true,
		maxZoomPixelRatio: 2,
		gestureSettingsMouse: { dblClickToZoom: true, clickToZoom: false },
		id:	"seadragon",
	});
	
	OsViewer.scalebar({
		type: OpenSeadragon.ScalebarType.MAP,
		location: OpenSeadragon.ScalebarLocation.BOTTOM_LEFT,
		pixelsPerMeter: 0,
		xOffset: 5,
		yOffset: 10,
		stayInsideImage: false,
		barThickness: 1,
		fontSize: '9px',
	});
	
	OsViewer.addControl($('#seadragon_meta')[0], {anchor: OpenSeadragon.ControlAnchor.NONE});
	OsViewer.addControl($('#seadragon_thumbs')[0], {anchor: OpenSeadragon.ControlAnchor.NONE});
	OsViewer.imageSelections = {};
	OsViewer.addHandler('open', function(e) {
		OsViewer.clearOverlays();
		setTimeout(function() { OsViewer.forceRedraw(); }, 400); // used to set viewport red square correct
		$('#seadragon').trigger('toggle_segm_seadragon');
		let basepath = $(OsViewer.element).attr('data-basepath');
		if (basepath && OsViewer.imageSelections[basepath]) {
			let selections = OsViewer.imageSelections[basepath];
			for (let i in selections) {
				var selection = selections[i];
				addSelection(i, selection, OsViewer);
				// if (selection.move_to_region) {
				// 	setTimeout(function () {
				// 		move_to_region(selection.x, selection.y, selection.width, selection.height, OsViewer, null, selection.rotation, 200);
				// 	}, 100);
				// }
			}
		}
	});
	$('#seadragon').on('fullScreen', function(event, fullScreen) {
		if (fullScreen) {
			var a = document.createElement('a'),
        ev = document.createEvent("MouseEvents");
			a.href = '#img'; // this will create history item
			ev.initMouseEvent("click", true, false, self, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			a.dispatchEvent(ev); // dispatch click
			$(this).show();
			OsViewer.viewport.viewer.navigator.updateSize();
		}
		else {
			if (window.location.hash == '#img') window.history.back();
			$(this).hide();
		}
	});
	$(document).on("keyup", function(e) {
		if (e.keyCode === 27 && window.location.hash == '#img') window.history.back(); // esc
	});
	$(window).on('hashchange', function(e) {
		if (e.originalEvent.oldURL.indexOf('#img') !== -1) $('#seadragon').trigger('fullScreen', [false]);
	});
	OsViewer.homeButton.removeAllHandlers();
	OsViewer.homeButton.addHandler("click", function() {
		window.history.back();
	});
	OsViewer.addHandler('open', function () {
		$("div[title='Go home']").prop('title', 'Close');

		$("div[title='Zoom in']").css({'cursor':'pointer'});
		$("div[title='Zoom out']").css({'cursor':'pointer'});
		$("div[title='Close']").css({'cursor':'pointer'});
	});
	
	$('#seadragon').data('OsViewer', OsViewer);
	return OsViewer;
}

function dragonImage() {
	$('.dragonImage').each(function() {
		// Seadragon
		var thisViewer = OpenSeadragon({
			id:	$(this).attr('id'),
			maxZoomPixelRatio: Infinity,
			prefixUrl: "/images_static/",
			preserveViewport: true,
			showHomeControl: false,
			mouseNavEnabled: true,
			showZoomControl: true,
			showFullPageControl: true,
			gestureSettingsMouse: { dblClickToZoom: true, clickToZoom: false },
		});
		// Only allow mousWheelZoom in fullScreen
		thisViewer.innerTracker.originalScrollHandler = thisViewer.innerTracker.scrollHandler;
		thisViewer.innerTracker.scrollHandler = false;
		thisViewer.addHandler('full-screen', function(e) {
			thisViewer.innerTracker.scrollHandler = e.fullScreen? thisViewer.innerTracker.originalScrollHandler : false;
		});
		if ($(this).attr('src').indexOf('.svg') != -1) {
			$.get($(this).attr('src'), function(svg) {
				var $svg = $(svg.replace("<?xml version='1.0' encoding='UTF-8' ?>", ''));
				// Load seadragon
				var org_w = parseInt($svg.attr('width'));
				var org_h = parseInt($svg.attr('height'));
				var tSize = 1000;
				thisViewer.open({
					width: org_w,
					tileSource: {
						height: org_h,
						width: org_w,
						tileSize: tSize,
						getTileUrl: function(level, x, y) {
							return '/images_static/pixel.php?w='+tSize+'&h='+tSize;
						}
					}
				});
				// Add SVG overlays
				var overlay = thisViewer.svgOverlay();
				$svg.children().each(function() {
					overlay.node().appendChild(this);
				});
				// Add pointers for toobox buttons & gene labels
				$("div[title='Zoom in']").css({'cursor':'pointer'});
				$("div[title='Zoom out']").css({'cursor':'pointer'});
				$("div[title='Toggle full page']").css({'cursor':'pointer'});
			}, 'text');
		}
		else {
			thisViewer.open({
				type: 'image',
				url:  $(this).attr('href'),
			});
		}
	});
}


// Toggle channel images
$.fn.getChannels = function() {
	'use strict';
	var channels = ['blue', 'red', 'green', 'yellow', 'magenta', 'lut'];
	var active_chnls = [];
	for (var i in channels) {
		if (channels.hasOwnProperty(i)) {
			if ($(this).find('.channel_button[name="' + channels[i] + '"]:not(.channel_inactive), .lut_button[name="' + channels[i] + '"]:not(.channel_inactive)').length) {
				active_chnls.push(channels[i]);
			}
		}
	}
	return active_chnls.join('_');
};

$.fn.getActiveChannels = function() {
	'use strict';
	var active_chnls = [];
	$(this).find('.channel_button:not(.channel_inactive), .lut_button:not(.channel_inactive)').each(function(){
		let attrib = 'name';
		if ($(this).hasClass('multiplex')) {
			attrib = 'data-channelid';
		}
		var name = $(this).attr(attrib);
		active_chnls.push(name);
	});
	return active_chnls;
};

$.fn.getChannelString = function(active_chnls) {
	'use strict';
	var datachannels = $(this).attr("data-channels");
	var channels = (datachannels && datachannels.length)? JSON.parse(datachannels) : ['blue', 'red', 'green', 'yellow', 'magenta', 'lut'];
	var chnls = [];
	for (var i in channels)	{
		if (channels.hasOwnProperty(i)) {
			if (active_chnls.indexOf(channels[i]) !== -1) {
				chnls.push(channels[i]);
			}
		}
	}
	return chnls.join('_');
};

$.fn.toggleChannel = function(moveTo) {
	'use strict';
	var c = $(this).getActiveChannels();
	var src, active_chnls;
	// Normal img-tags
	$(this).find('img.channel_image').each(function() {
		active_chnls = $(this).getChannelString(c);
		if ($(this).attr("data-basepath") === "")  {
			return;
		}
		if (active_chnls === 'lut' || active_chnls === '') {
			src = '/images_static/black.gif';
			if ($(this).attr('src').indexOf('medium') !== -1) {
				src += '?medium';
			}
			if ($(this).attr('src').indexOf('thumb') !== -1) {
				src += '?thumb';
			}
		}
		else {
			src = $(this).attr('data-basepath') + '_' + active_chnls;
			if ($(this).attr('src').indexOf('medium') !== -1) {
				src += '_medium';
			}
			if ($(this).attr('src').indexOf('thumb') !== -1) {
				src += '_thumb';
			}
			if ($(this).attr('src').indexOf('50x50') !== -1) {
				src += '_50x50';
			}
			src += '.jpg';
		}
		$(this).attr('src', src);
	});
	// Multiplex viewer
	$(this).find('.multiplex_image').each(function() {
		let v = OpenSeadragon.getViewer($(this).attr('id'));
		c.sort();
		let active_chnls = $(this).getChannelString(c);
		let src;
		if (active_chnls === '') {
			src = '/images_static/black.gif';
		} else {
			let curr_image = $(this).find('.sectionnav_links[name="'+v.currentPage()+'"] img');
			let basepath;
			if (curr_image.length) {
				basepath = curr_image.attr('data-basepath');
			} else {
				basepath = $(this).find('[name="multipleximage"]').attr('data-basepath');
			}
			src = basepath + '_' + active_chnls + '.jpg';
		}
		if (moveTo) {
			v.center = v.viewport.getCenter(true);
			v.zoom = v.viewport.getZoom();
		}
		v.open({
			type: 'image',
			url: src
		});

		$(this).find('.sectionnav_links img').each(function() {
			let src;
			if (active_chnls === '') {
				src = '/images_static/black.gif';
			} else {
				src = $(this).attr('data-basepath')+ '_' + active_chnls + '_50x50.jpg';
			}
			$(this).attr('src', src);
		});
	});
	// Seadragon full screen
	if ($(this).attr('id') === 'seadragon') {
		active_chnls = $(this).getChannelString(c);
		if (active_chnls === 'lut' || active_chnls === '') {
			src = '/images_static/black.gif';
		} else {
			src = $(this).attr('data-basepath')+ '_' + active_chnls + '.jpg';
		}
		seadragon().open({
			type: 'image',
			url:  src
		});
	}
};
