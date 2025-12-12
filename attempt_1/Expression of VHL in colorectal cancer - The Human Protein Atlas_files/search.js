/* globals $ */

// eslint-disable-next-line no-use-before-define
var geneFilters = geneFilters || {
	location: undefined,
	genes: undefined,
	searchString: '',
};
$(function() {
	// Search form
	$('.searchForm').on('submit', function() {
		var query = encodeURIComponent(getSearchMainJqElem(this).find('.searchQuery').val()).replace(/%20/g, "+").replace(/%3A/g, ":").replace(/%3B/g, ";").replace(/\r|\n/g, " ").replace(/\s+/g, " ").trim();
		window.location.href = '/search/'+query;
		return false;
	});
	// Toggle fields
	$('.fieldsForm').on('toggleFields', function() {
		var mainElem = getSearchMainJqElem(this);
		var currentSrch = mainElem.find('.searchQuery').prop('disabled', !$(this).is(':visible')).val();
		mainElem.find('.searchAnd').val(currentSrch?'AND':'').selectmenu("refresh");
		mainElem.find('.fieldsForm').toggle();
	});
	// Field link
	$('#fieldsLink, .fieldsLink').on('click', function() {
		var savedSearchDisplay = $('.saved_search_results');
		var mainElem = getSearchMainJqElem(this);
		if ((mainElem.find('.fieldsForm').is(':visible')) && (savedSearchDisplay.html() && savedSearchDisplay.html().length > 30)) {
			savedSearchDisplay.show();
		} else {
			savedSearchDisplay.hide();
		}
		mainElem.find('.fieldsForm').trigger('toggleFields');
		ga_event('search_fields_show');
		return false;
	});
	$('select.mainSearchField').on('selectmenuchange', function() {
		var mainElem = getSearchMainJqElem(this);
		mainElem.find('.subSearchField').addClass('hidden').filter('[data-id="'+$(this).val()+'"]').removeClass('hidden');
	}).trigger('selectmenuchange');

	$('.fieldsForm').each(function() {
		var mainElem = getSearchMainJqElem(this);
		var appendElem = '#' + mainElem.attr('id') + " .fieldsForm";
		// Selects
		$(this).find('.searchAnd').selectmenu({
			appendTo: appendElem,
			width: 72,
			position: {
				collision: 'flip',
			},
		});
		$(this).find('.dropselect:not(.searchAnd)').selectmenu({
			appendTo: appendElem,
			width: 180,
			position: {
				collision: 'flip',
			},
		});
		// Multi selects
		$(this).find('.dropcheck').multiselect({
			header: false,
			selectedList: 1,
			appendTo: appendElem,
			buttonWidth: '180px',
			menuWidth: 'auto',
			menuHeight: '365px',
			position: {
				collision: 'flip',
			},
		});
		$(this).find('.dropfilter').multiselect({
			appendTo: appendElem,
			menuWidth: 'auto',
			menuHeight: '365px',
			position: {
				collision: 'flip',
			},
		}).multiselectfilter();
	});

	// Sub selects
	$('.fieldsForm select[subselect]').on('selectmenuchange change', function() {
		var mainElem = getSearchMainJqElem(this);
		var field = $(this).closest('.subSearchField').attr('data-id');
		var input = $(this).attr('data-id');
		var term = $(this).val() ?? '';
		var prntQuery = '';
		var $parent = $('[subselect='+input+']');
		if ($parent.length) {
			prntQuery = '&parentField='+$parent.attr('data-id')+'&parentValue='+$parent.val();
		}
		var $el = mainElem.find('[data-id="'+$(this).attr('subselect')+'"]');
		$.get("/search_ajax.php?field="+field+"&input="+input+"&term="+term + prntQuery, function(response) {
			if ($el.is('.dropfilter, .dropcheck')) {
				if (response) {
					$el.html(response).multiselect("refresh").trigger('selectmenuchange').closest('div').removeClass('hidden');
				} else {
					$el.html('').val('').multiselect("refresh").trigger('selectmenuchange').closest('div').addClass('hidden');
				}
			} else {
				if (response) {
					$el.html(response).selectmenu("refresh").trigger('selectmenuchange').closest('div').removeClass('hidden');
				} else {
					$el.html('').val('').selectmenu("refresh").trigger('selectmenuchange').closest('div').addClass('hidden');
				}
			}
		});
	});
	// Autocomplete
	$(".fieldsForm .autocomplete").each(function() {
		var field = $(this).closest('.subSearchField').attr('data-id');
		var input = $(this).attr('data-id');
		var mainElem = getSearchMainJqElem(this);
		$(this).autocomplete({
			appendTo: '#' + mainElem.attr("id") + " .fieldsForm",
			source: "/search_ajax.php?field="+field+"&input="+input,
		});
	});
	// Add field search
	$(".fieldsAdd").on('click', function() {
		var mainElem = getSearchMainJqElem(this);
		var currentSrch = mainElem.find('input.searchQuery').val();
		var conds = [];
		mainElem.find('.fieldsForm .subSearchField:visible').find('select, input[type=text]').each(function() {
			if ($(this).val() && $(this).val().length) {
				conds.push($(this).val());
			}
		});
		
		var conditions = conds.join(';').trim();
		if (!conditions) {
			alert('No condition set.');
			return false;
		}
		var updatedSrch = currentSrch+' '+mainElem.find('select.searchAnd').val()+' '+mainElem.find('select.mainSearchField').val()+':'+conditions;
		mainElem.find('.searchQuery').val(updatedSrch.trim());
		mainElem.find(".fieldsCancel").trigger('click');
		$(this).closest('form').trigger('reset');
		mainElem.find('select.mainSearchField').selectmenu("refresh").trigger('selectmenuchange');
		return false;
	});
	// Cancel
	$(".fieldsCancel").on('click', function() {
		var mainElem = getSearchMainJqElem(this);
		mainElem.find('.fieldsForm').trigger('toggleFields');
		return false;
	});
	
	//localStorage with gene_ids and keys to navigate prev/next search result
	var saved_search_genes = JSON.parse(localStorage.getItem('saved_search_genes'));
	var current_gene_id = $(".atlas_header").attr('gene_id');
	if(current_gene_id && saved_search_genes) {
		if(!saved_search_genes[current_gene_id]) {
			var current_key = 0;
		} else {
			var current_key = eval(saved_search_genes[current_gene_id]);
		}
		var saved_search_keys = JSON.parse(localStorage.getItem('saved_search_keys'));
		var genes = [];
		var saved_keys_length = Object.keys(saved_search_keys).length;
		if(saved_keys_length>0) {
			$(".saved_search_results").show("fade");
			if(current_key>1) genes.push(saved_search_keys[(current_key-2)+'']);
			if(current_key>0) genes.push(saved_search_keys[(current_key-1)+'']);
			genes.push(saved_search_keys[current_key+'']);
			if(current_key<saved_keys_length-1) genes.push(saved_search_keys[(current_key+1)+'']);
			if(current_key<saved_keys_length-2) genes.push(saved_search_keys[(current_key+2)+'']);
			var current_url = window.location.pathname;
			$.get("/saved_search_result_ajax.php?gene_ids="+genes.join(','), function(response) {
				var $search_urls = [];
				var atlas = '';
				if (response) {
					var gene_data = JSON.parse(response);
					$.each(gene_data, function(index, value) {
						if (current_url.match(value[1]+'')) {
							$search_urls.push('<b>'+value[0]+'</b>');
						} else {
							var suffix = current_url.match(/ENSG[0-9]+\-[a-zA-Z0-9\.-]+\/(.*)/);
							if (suffix) atlas = suffix[1];
							if (atlas.indexOf('interaction/')!=-1) atlas = 'interaction';
							$search_urls.push("<a href='/"+value[1]+"-"+value[0]+"/"+atlas+"'>"+value[0]+'</a>');
						}
					})
					$(".saved_search_results span").html(' <p>('+saved_keys_length+' genes):</p> '+(current_key>2?'... ':'')+$search_urls.join(' | ')+(current_key<(saved_keys_length-3)?' ...':''));
				}
			});
		}
	}


	/* ## FILTER FUNCTIONS */
	$('#geneFilterToggle').on('click', function() {
		var filterDiv = $('#filterPlacement.genes');
		filterDiv.toggle();
		var isFilterVisible = filterDiv.is(':visible');
		$('#showFilter').toggleClass('visible');
		return false;
	});

	$('#filterGenes .searchQuery').on('change, keyup', function() {
		if ($(this).val() === geneFilters.searchString) {
			$(this).removeClass('searchChanged');
		} else {
			$(this).addClass('searchChanged');
		}
	}).on('keypress', function(e) {
		var code = e.keyCode || e.which;
		if (code === 13) {
			$('#filterGenesButton').trigger('click');
			e.preventDefault();
			return false;
		}
		return true;
	}).trigger('change');
	$('.filterExample').on('click', function() {
		var str = $(this).attr('data-example');
		$(this).parents('.searchDisplay').first().find('.searchQuery').val(decodeURIComponent(str.replace(/\+/g, ' ')));
		$('#filterGenesButton').trigger('click');
	});
	$('#filterGenesButton').on('click', function() {
		var searchInput = $('#filterGenes .searchQuery');
		var query = searchInput.val();
		if (query) {
			history.replaceHash('#search_'+ query);
		}
		$.get({
			url: '/search_ajax.php',
			data: {
				geneList: 1,
				search: query,
			}
		}).done(function(data) {
			// set geneList
			if (data.genes) {
				geneFilters.genes = data.genes;
			}
			geneFilters.searchString = query;
			searchInput.trigger('change');
			$('#filterGenes').trigger('change');
		});
	});
	$('#filterGenesReset').on('click', function() {
		geneFilters.genes = undefined;
		$('#filterGenes .searchQuery').val('').trigger('change');
		$('#filterGenes').trigger('change');
	});
	$('#filterGenesSearch').on('click', function() {
		$('#filterGenes .searchQuery').trigger('submit');
	});

	if (location.hash && location.hash.startsWith('#search_')) {
		var hashValue = location.hash.replace('#search_', '');
		if (hashValue) {
			$('#filterGenes .searchQuery').val(decodeURIComponent(hashValue));
			$('#filterGenesButton, #geneFilterToggle').trigger('click');
		}
	}


	//####################
	//## Custom download
	$("#toggleDownloadLink").on("click", function() {
		toggleDownloadForm();
		ga_event('custom_download');
		return false;
	});

	$(".customDownloadCopy").on("click", function() {
		copyToClipboard($(this).siblings(".downloadString").val());
		var value = $(this).html();
		$(this).text("Copied!");
		var that = $(this);
		setTimeout(function() {
			that.text(value);
		}, 1000);
	});

	updateCustomURL();
	$("#customDownload input").on("change", function() {
		updateCustomURL();
	});

	$("#customDownload a.openlink").on("click", function() {
		var name = $(this).attr("data-name");
		var groupDiv = $("#customDownload div#" + name);
		groupDiv.toggle();
		$(this).toggleClass('show');
		$(this).html(groupDiv.is(":visible") ? "Close" : "Expand");
	});
	$("#customDownload input.toggleAll").on("change", function() {
		var name = $(this).attr("name");
		$(this).parents(".downloadClass").find(".downloadClassItems input").prop('checked', $(this).prop('checked'));
		updateCustomURL();
	});
	$('#customDownload div.downloadClassItems input').on("change", function() {
		var itemParent = $(this).parents("div.downloadClassItems");
		var check = $(this).parents("div.downloadClass").find("input.toggleAll");
		if (itemParent.find('input:checked').length === 0) {
			check.
			prop("indeterminate", false).
			prop('checked', false);
		} else if (itemParent.find('input:not(:checked)').length === 0) {
			check.
			prop("indeterminate", false).
			prop('checked', true);
		} else {
			check.
			prop("indeterminate", true);
		}
		updateCustomURL();
	}).trigger("change");

	//####################
	//## Show hide columns
	$("#toggleColumnLink").on("click", function() {
		toggleColumnForm();
		ga_event('show_hide_columns');
		return false;
	});

	//####################
	//## Custom reports
	$("#toggleReportLink").on("click", function() {
		toggleReportForm();
		ga_event('custom_report');
		return false;
	});

	$("#customReport a.openlink").on("click", function() {
		var name = $(this).attr("data-name");
		var groupDiv = $("#customReport div#" + name);
		groupDiv.toggle();
		$(this).toggleClass('show');
		$(this).html(groupDiv.is(":visible") ? "Close" : "Expand");
	});
	$("#customReport input.toggleAll").on("change", function() {
		var name = $(this).attr("name");
		$(this).parents(".downloadClass").find(".downloadClassItems input").prop('checked', $(this).prop('checked'));
		updateReportURL();
	});
	$('#customReport div.downloadClassItems input').on("change", function() {
		var itemParent = $(this).parents("div.downloadClassItems");
		var check = $(this).parents("div.downloadClass").find("input.toggleAll");
		if (itemParent.find('input:checked').length === 0) {
			check.
			prop("indeterminate", false).
			prop('checked', false);
		} else if (itemParent.find('input:not(:checked)').length === 0) {
			check.
			prop("indeterminate", false).
			prop('checked', true);
		} else {
			check.
			prop("indeterminate", true);
		}
		updateReportURL();
	}).trigger("change");
	$("#customReport input:radio").on("change", function() {
		updateReportURL();
	});
});

function getSearchMainJqElem(elem) {
	return $(elem).closest('.searchDisplay');
}
function hideColumn(col, el) {
	var cols = getCookie('columns').split(',');
	var newCols = [];
	for (var i in cols) {
		if (cols[i] != col) newCols.push(cols[i]);
	}
	setCookie('columns', newCols.join(','));
	var $th = $(el).closest('th.column');
	var idx = $th.closest('tr').children().index($th)+1;
	$('#searchResult, .searchResult').find("th.column:nth-child(" +idx+ ")").remove();
	$('.searchResult').find("td:nth-child(" +idx+ ")").remove();
	$('input#'+col).removeAttr('checked').prop('checked', false);
}
function updateReportURL() {
	var searchString = $(".searchQuery").val();
	var arr = [];
	$("#customReport input:checkbox:checked").each(function() {
		var abbr = $(this).attr("data-abbr");
		if (typeof abbr !== "undefined" && abbr !== "") {
			arr.push($(this).attr("data-abbr"));
		}
	});
	var host;
	if (!window.location.origin) {
		host = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
	} else {
		host = window.location.origin;
	}
	var url = host + "/search_result.php?query1="+encodeURIComponent(searchString)+"&columns="+arr.map(function(val){return encodeURIComponent(val);}).join(",");
	var report = $(".reportType:checked").val();
	var url2 = url+"&report=" + report;
	$("#customReportButton").attr("href", url2);
}

//####################
//## Page links
function page_link(e, inpt, current_page, last_page, url) {
	if (e.keyCode==13) {
		if (inpt.value > 0 && inpt.value <= last_page) {
			document.location.href = url+'/'+inpt.value;
		}
		else {
			inpt.value = current_page;
		}
	}
}

function copyToClipboard(text) {
	// From https://github.com/feross/clipboard-copy/blob/master/index.js
	// Put the text to copy into a <span>
	var span = document.createElement('span');
	span.textContent = text;

	// Preserve consecutive spaces and newlines
	span.style.whiteSpace = 'pre';

	// Add the <span> to the page
	document.body.appendChild(span);

	// Make a selection object representing the range of text selected by the user
	var selection = window.getSelection();
	var range = window.document.createRange();
	selection.removeAllRanges();
	range.selectNode(span);
	selection.addRange(range);

	// Copy text to the clipboard
	try {
		window.document.execCommand('copy');
	} catch (err) {
		console.log('error', err);
	}

	// Cleanup
	selection.removeAllRanges();
	window.document.body.removeChild(span);
}

function updateCustomURL() {
	var searchString = $(".searchQuery").val();
	var arr = [];
	$("#customDownload input:checkbox:checked").each(function() {
		var abbr = $(this).attr("data-abbr");
		if (typeof abbr !== "undefined" && abbr !== "") {
			arr.push($(this).attr("data-abbr"));
		}
	});
	var host;
	if (!window.location.origin) {
		host = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
	} else {
		host = window.location.origin;
	}
	var url = host + "/api/search_download.php?search="+encodeURIComponent(searchString)+"&columns="+arr.map(function(val){return encodeURIComponent(val);}).join(",")+"&compress=no";
	$(".downloadString").each(function() {
		var format = $(this).parent(".formatGroup").attr("data-format");
		var url2 = url+"&format=" + format;
		$(this).val(url2);
		var url3 = url2+"&download=yes";
		$(this).siblings(".customDownload").attr("href", url3);
	});
}
function toggleColumnForm() {
	if ($("#customDownload").is(":visible")) {
		$('#toggleDownloadLink').trigger('click');
	}
	if ($("#customReport").is(":visible")) {
		$('#toggleReportLink').trigger('click');
	}
	$("#show_hide_columns")[0].reset();
	$("#toggleColumnLink").toggleClass("show");
	$("#showHideColumns").slideToggle("fast");
}
function showHideColumns(frm) {
	var cols = [];
	$(frm).find('input').each(function() {
		if ($(this).is(':checked')) cols.push($(this).attr('id'));
	});
	setCookie('columns', cols.join(','));
	$('#search .searchForm').trigger("submit");
}
function defaultColumns(frm) {
	var cols = [];
	$(frm).find('input').each(function() {
		if ($(this).is('[default]')) {
			$(this).prop('checked', true);
			cols.push($(this).attr('id'));
		}
		else $(this).prop('checked', false);
	});
	setCookie('columns', cols.join(','));
}
function toggleDownloadForm() {
	if ($("#showHideColumns").is(":visible")) {
		$('#toggleColumnLink').trigger('click');
	}
	if ($("#customReport").is(":visible")) {
		$('#toggleReportLink').trigger('click');
	}
	$("#toggleDownloadLink").toggleClass("show");
	$("#customDownload").slideToggle("fast");
}
function toggleReportForm() {
	if ($("#customDownload").is(":visible")) {
		$('#toggleDownloadLink').trigger('click');
	}
	if ($("#showHideColumns").is(":visible")) {
		$('#toggleColumnLink').trigger('click');
	}
	$("#toggleReportLink").toggleClass("show");
	$("#customReport").slideToggle("fast");
}