var selected_annotations = new Array();

//## Select images
function selectImages(selectId) {
	selected_annotations = new Array();
	var checkbox = getElement(selectId);
	checkbox.checked=!checkbox.checked;
	var selected = document.getElementsByName('selectBox');
	var selections = new Array();
	var staining = new Array();
	var intensity = new Array();
	var quantity = new Array();
	var location = new Array();
	var checked_name = new Array();
	for (var i=0; i<selected.length; i++) {
		if (selected[i].checked) {
			var attributes = selected[i].id.split('_');
			switch (attributes[1]) {
				case 'Staining': staining.push( attributes[2]); break;
				case 'Intensity': intensity.push( attributes[2]); break;
				case 'Quantity': quantity.push( attributes[2]); break;
				case 'Location': location.push( attributes[2]); break;
			}
		}
	}
	var annotation = new Array();
	var element = document.getElementsByTagName('div');
	for (var i=0; i<element.length;i++) {		
		if (element[i].getAttribute("name") == 'annotationPair') annotation.push(getElement(element[i].getAttribute("id")));
	}
	for (var i=0; i<annotation.length; i++) {
		var attributes = annotation[i].id.split('_');
		if (( staining.length==0 || staining.indexOf(attributes[1])!== -1) &&
			( intensity.length==0 || intensity.indexOf(attributes[2]) !== -1) &&
			( quantity.length==0 || quantity.indexOf(attributes[3]) !== -1) &&
			( location.length==0 || location.indexOf(attributes[4]) !== -1) &&
			 ( location.length+quantity.length+intensity.length+staining.length!=0) ) {			
				annotation[i].style.border= 'solid #6fcb6f 2px';
				selected_annotations.push(attributes[0]);			
		} else {
			annotation[i].style.border= 'solid #D9D9D9 2px';
		}
	}
}

function get_selected_annotations() {
	return '&annotation_id=' + selected_annotations.toString();
}


$(function() {
	// Toggle data points
	$('button.toggle').on("click", function() {
		$(this).toggleClass('inactive');
		var $svg = $(this).closest('.cancer').find('svg.scatterplot');
		var $dots = $svg.find('a.dot');
		$dots.removeClass('hide');
		$(this).closest('.cancer').find('button.toggle.inactive').each(function() {
			$($(this).attr('name')).addClass('hide');
		});
		$dots.filter('.hide').hide();
		$dots.filter(':not(.hide)').show();
		
		$svg.find('.group').each(
			function() {
				var idx = $(this).attr("name").substring("group".length);
				var group_count = $(this).find('a.dot:not(.hide)').length;
				var text_elem = $svg.find('.legend[name="legend'+idx+'"] text');
				text_elem.text(text_elem.text().replace(/=\d+/, '='+group_count));
			}
		);
		$svg.trigger('fixdata').trigger('rescale');
	});
	// Toggle lin/log scale
	$('button[name="xscale"]').on("click", function() {
		$(this).closest('.cancer').find('svg.scatterplot').trigger('rescale', $(this).attr('class').replace(' ', ''));
		$(this).toggleClass('xlog').toggleClass('xlin');
	});
	// Set cut off from links
	$('a.cutoff').on("click", function() {
		$(this).closest('.cancer').find('svg.scatterplot').trigger('setCutoff', 1*$(this).attr('value'), true);
		return false;
	});
	// Set cut off from input
	$('input.cutoff').on("change", function() {
		$(this).closest('.cancer').find('svg.scatterplot').trigger('setCutoff', 1*$(this).val(), true);
	});
});

function get_survival_data(kaplan_data, cutoff, withKM, withSurvivalRates) {
	var k_data = [];
	k_data['under'] = [];
	k_data['over'] = [];
	var tpm_all = [];
	var tpm_data = [];
	tpm_data[0] = [];
	tpm_data[1] = [];
	var days_all = [];
	var days_data = [];
	days_data['under'] = [];
	days_data['over'] = [];
	var median = [];
	var q20, q80;
	var survival_3y = [];
	var survival_5y = [];
	// Sort data
	for (var i=0; i<kaplan_data.length; i++) {
		if ($('.'+kaplan_data[i].sample).hasClass('hide')) continue;
		var key = kaplan_data[i].tpm <= cutoff? 'under' : 'over';
		k_data[key].push(kaplan_data[i]);
		if (kaplan_data[i].dead) days_data[key].push(kaplan_data[i].living_years);
		if (withKM) {
			tpm_all.push(kaplan_data[i].tpm);
			tpm_data[kaplan_data[i].dead?0:1].push(kaplan_data[i].tpm);
			days_all.push(kaplan_data[i].living_years);
		}
	}
	median['under'] = days_data['under'].length? ss.median(days_data['under']) : 0;
	median['over'] = days_data['over'].length? ss.median(days_data['over']) : 0;
	if (withKM) {
		median['tpm'] = tpm_all.length? ss.median(tpm_all) : 0;
		median['days'] = days_all.length? ss.median(days_all) : 0;
		median[0] = tpm_data[0].length? ss.median(tpm_data[0]) : 0;
		median[1] = tpm_data[1].length? ss.median(tpm_data[1]) : 0;
		q20 = tpm_all.length? ss.quantile(tpm_all, 0.2) : cutoff-0.1;
		q80 = tpm_all.length? ss.quantile(tpm_all, 0.8) : cutoff+0.1;
	}
	// Calc survival
	var km = [];
	var grps = [];
	var groups = [];
	var p = [];
	if (!withKM || (cutoff >= q20 && cutoff <= q80)) {
		for (var g in k_data) {
			if (!k_data.hasOwnProperty(g)) continue;
			var tte = pluck(k_data[g], 'living_years');
			var ev = pluck(k_data[g], 'dead');
			if (withKM) {
				var kmp = compute(tte, ev);
				km.push(kmp);
				// Survival rates
				if (withSurvivalRates) {
					for (var k=0; k<kmp.length; k++) {
						if (!survival_3y[g] && kmp[k].t > 3) survival_3y[g] = Math.round(kmp[k-1].s*100);
						if (!survival_5y[g] && kmp[k].t > 5) survival_5y[g] = Math.round(kmp[k-1].s*100);
					}
				}
			}
			grps.push({'tte':tte, 'ev':ev});
			groups.push({'name': (g=='over'?'High':'Low') + " expression (n="+tte.length+")"});
		}
		p = logranktest(grps);
	}
	return {
		'p':p,
		'km':km,
		'groups':groups,
		'under':k_data['under'].length,
		'over':k_data['over'].length,
		'tpm_data':tpm_data,
		'days_data':days_data,
		'survival_3y':survival_3y,
		'survival_5y':survival_5y,
		'median':median,
		'q20':q20,
		'q80':q80
	};
}

function setLabelPos(plot, clss, pos, txt, title, newCoord) {
	var label_corods = {
		2:{'translate':"newCoord,"+(plot.settings.labelSpace-plot.settings.padding.t), 'rect':[-plot.settings.labelWidth-10,-20-plot.settings.labelHeight/2], 'path':[[0,0], [0,-10], [-10,-20]]},
		3:{'translate':"newCoord,"+(plot.settings.labelSpace-plot.settings.padding.t), 'rect':[10,-20-plot.settings.labelHeight/2], 'path':[[0,0], [0,-10], [10,-20]]},
		4:{'translate':(plot.w+plot.settings.padding.r-plot.settings.labelSpace)+",newCoord", 'rect':[20,-10-plot.settings.labelHeight/2], 'path':[[0,0], [10,0], [20,-10]]},
		5:{'translate':(plot.w+plot.settings.padding.r-plot.settings.labelSpace)+",newCoord", 'rect':[20,10-plot.settings.labelHeight/2], 'path':[[0,0], [10,0], [20,10]]}
	};
	newCoord = newCoord? newCoord : 0;
	var label_line = d3.line()
		.x(function(d) { return d[0]; })
		.y(function(d) { return d[1]; });
	var lc = label_corods[pos];
	var t = d3.transition().duration(plot.settings.transitionTime);
	var g = plot.vis.selectAll('.median_'+clss);
	g.transition(t)
		.attr('transform', 'translate('+lc['translate'].replace('newCoord', newCoord)+')')
		.attr('title', title?title:'');
	g.selectAll('path').datum(lc['path'])
		.transition(t)
		.attr('d', label_line);
	g.selectAll('rect')
		.transition(t)
		.attr('x', lc['rect'][0])
		.attr('y', lc['rect'][1]);
	g.selectAll('text')
		.transition(t)
		.attr('x', lc['rect'][0])
		.attr('y', lc['rect'][1])
		.text(txt?txt:'');
}

function get_gauss(size, vertical) {
	var gauss = [];
	for (var x=-size/2; x<=size/2; x++) {
		var y = 1 / Math.sqrt(2 * Math.PI) * Math.exp(-.1 * x * x) / (0.4/size);
		if (vertical) gauss.push([x, size - y]);
		else gauss.push([y-size/2, x+size/2]);
	}
	return gauss;
}
