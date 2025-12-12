$(function() {
	// Menu
	$("div.dropdown > a").on("click", function(e) {
		if ($(this).parent().hasClass("display")) {
			closeMenu();
		}
		else {
			closeMenu();
			$(this).parent().addClass("display");
		}
		return false;
	});
	//Hide menu on esc
	$(document).on("keyup", function(e) {
		// esc
	  if (e.keyCode === 27) closeMenu();
	});
	//Hide menu on click outside of element
	$(document).on("mouseup", function(e) {
    var container = $("div.dropdown ul.nav");
    var about = $("div.dropdown a");
    if (!(container.has(e.target).length || container.is(e.target)) && !(about.has(e.target).length || about.is(e.target))) closeMenu();
	});
	function closeMenu() {
		$('div.dropdown').removeClass("display");
	}
	
	var crumbs = new Array();
	if ($(".nav li span.active").length>0) { // About pages
		var active_section = $(".nav li span.active").closest('div');
		if (active_section.length) {
			var txt = active_section.find('li.nav-cat').html();
			if (!txt) {
				txt = active_section.find('a:first').text();
			}
			crumbs.push($('<span>').append(txt));
		}
		crumbs.push($('<span>').append($(".nav li span.active a").clone().html( $(".nav li span.active a").html().trim() ) ));
	}
	
	$(".crumb").each(function() {
		crumbs.push( $('<span>').append($(this).clone().attr('style','').removeClass().html( $(this).html().toUpperCase().trim())) );
	});		
	
	for (i=1; i<=6;i++) {
		if ($(".crumb_"+i).length>0) {
			//Trim, to uppercase, drop style attribute
			crumbs[i-1] = $('<span>').append( $('.crumb_'+i).clone().attr('style','').removeClass().html( $('.crumb_'+i).html().toUpperCase().trim()));
		}
	}
	
	//Build breadcrumb
	for (var i = 0; i < crumbs.length; i++) {
		if ($("#breadcrumb").children().length>0) {
			if ($("#breadcrumb").children().length == 1) {
				$("#breadcrumb").append('<span><b>:</b></span>');
			} else {
				$("#breadcrumb").append('<span>&gt;</span>');
			}
		}
		$("#breadcrumb").append(crumbs[i]);
	}
	$("#breadcrumb").children().last().children().first().addClass('crumb_active');

	function add_header_border() {
		if ($(window).scrollTop() >= $('.page_header').height()-50) {
			$(".page_header").addClass("show_small");
			$(".atlas_nav").addClass("show_small");
		}
		else {
			$(".page_header").removeClass("show_small");
			$(".atlas_nav").removeClass("show_small");
		}			
	}
	$(window).on("scroll", function() {
		add_header_border();	
	});
	add_header_border();

	/*Fix for header overlap on anchored element*/
	function scroll_offset() {
		if ($(":target").length > 0) {
			setTimeout(function() {var pos = $(window).scrollTop(); $(window).scrollTop(pos-140); add_header_border();}, 0); //Header height offset -10
		} else if (window.location.hash && !!$(window.location.hash)[0]) {
			setTimeout(function() {var pos = $(window).scrollTop(); $(window).scrollTop(pos-140); add_header_border();}, 0); //Header height offset -10
		}
	}

	$(".menu a[href*='#'], .menufix a[href*='#'], .linkoffsetfix a[href*='#'], .tooltip a[href^='#']").not('.no_onpage_link, .colorbox, a[target*="_blank"]').addClass("onpage_link").on("click", function(e) {
		var str = $(this).attr('href');
		var id = str.substring(str.lastIndexOf('#')+1)
		//offset handled
		if($("[id='"+id+"'].anchor_offset").length != 0)
			return;
		
		// "Normalize" cross-browser mouse click event, below IE specific
		if (!e.which && e.button) {
			e.which = 0;
			if (e.button & 4) e.which = 2
		}
		if (e.ctrlKey || e.metaKey || e.which==2) {
			window.open(str, '_blank');
			return false;
		}
		e.stopPropagation();
		e.preventDefault();
		
		if ($("[id='"+id+"']").length > 0) {
			$("[id='"+id+"']")[0].scrollIntoView();
			scroll_offset();
		}
	});
});
