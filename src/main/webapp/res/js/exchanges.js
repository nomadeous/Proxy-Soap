/*********************************************
 * COOKIE MANAGEMENT
 *********************************************/
// TODO : delete
var Cookie = {
    set: function(name, value) {
        document.cookie = name + "=" + value + "; max-age=" + (60 * 60 * 24 * 10);
    },
    get: function(name) {
        var cookies = document.cookie.split(';');

        for (var i in cookies) {
            var c = cookies[i].trim().split('=');
            if (c[0] == name)
                return c[1];
        }

        return null;
    }
};

/*********************************************
 * /COOKIE MANAGEMENT
 *********************************************/

// create fully selectable areas
jQuery.fn.selectText = function() {
    var doc = document;
    var element = this[0];
    // add blur / click behavior
    console.log(this, element);
    if (doc.body.createTextRange) {
        var range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        var selection = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
};

$(function() {
    var timer = 0;
    /*$table = $('.fixed-table-container');
     $table.addClass('panel-collapse collapse in');
     $table.attr('role', 'tabpanel');
     $table.attr('aria-labelledby', 'headingOne');*/


    $(window).resize(function() {
        $('#exchangestable').bootstrapTable('resetView');
    });

    $("#exchangedetails pre code").click(function() {
        $(this).selectText();
    });
    $('#exchangestable').on('column-switch.bs.table', function(e, field, checked) {
        // TODO : set httpOnly on the cookie to avoid sending it to server via ajax
        // read
        var fields = $.cookie('fields')
        if (fields === undefined) {
            fields = {};
        } else {
            fields = JSON.parse(fields);
        }
        fields[field] = checked;
        // save
        $.cookie('fields', JSON.stringify(fields), {expires: 7, path: '/'});
    });

    var fields = $.cookie('fields');
    if (fields !== undefined) {
        console.log('cookie found : ' + fields);
        fields = JSON.parse(fields);
        for (var key in fields) {
            console.log(key + "=" + fields[key]);
            if (fields[key] === true) {
                $('#exchangestable').bootstrapTable('showColumn', key);
            } else {
                $('#exchangestable').bootstrapTable('hideColumn', key);
            }
        }
    }

    var exchangesCache = {};
    $('#exchangestable').on('click-row.bs.table', function(e, rowData, elem) {
        if (rowData.id) {
            $('#exchangestable tr.selected').removeClass('selected');
            elem.addClass('selected');
            if (exchangesCache[rowData.id]) {
                console.log('exchange already there');
                displayExchange(exchangesCache[rowData.id]);
            } else {
                $.ajax({
                    type: 'GET',
                    url: 'resources/exchange/' + rowData.id + '?accept=application/json',
                    dataType: 'json'
                })
                        .done(function(exchange) {
                            exchangesCache[exchange.id] = exchange;
                            displayExchange(exchange);
                        })
                        .fail(function() {
                            console.log("error on loading exchange");
                        });
            }
        }
    });

    $('#menutabs a[href="#validators"]').on('shown.bs.tab', function(e) {
        validator = window.location.hash;
        console.log(validator);
        if (validator) {
            $('html,body').scrollTop($(validator).offset().top);
        }
    })

    $('.autorefresh')
            .click(function() {
                console.log($(this));
                if ($(this).data('enabled')) {
                    clearTimeout(timer);
                    $(this).data('enabled', false);
                    $('span', this).text('off');
                } else {
                    timer = setTimeout(function() {
                        window.location.reload();
                    }, 4000);
                    $(this).data('enabled', true);
                    $('span', this).text('on');
                }

                Cookie.set('autorefresh', $(this).data('enabled'));
            })
            .data('enabled', Cookie.get('autorefresh') != "true")
            .click();

    $('[accesskey]').each(function() {
        $(document).on('keyup', null, $(this).attr('accesskey'), function(e) {
            $('[accesskey=' + e.key + ']').click();
        });
    });
}
);

function displayExchange(exchange) {
    $details = $('#exchangedetails');
    $details.removeClass('hidden');
    $details.find('.panel-body').collapse('show');
    $('html,body').animate({
        scrollTop: $details.offset().top
    });

    $('#exchangeId').html(exchange.id);
    $('#request_status').html(statusFormatter(exchange.requestValid, exchange.requestXmlValid, exchange.validatorId));
    $('#response_status').html(statusFormatter(exchange.responseValid, exchange.responseXmlValid, exchange.validatorId));
    $('#proxy_validation_status').html(validationFormatter(exchange.proxyValidating));
    $('#proxy_blocking_status').html(blockingFormatter(exchange.proxyBlocking));

    // request
    $('#reqheaders pre code').text(formatMap(exchange.frontEndRequestHeaders));
    $('#reqcontent pre code').text(exchange.frontEndRequest);
    if (typeof exchange.requestErrors === 'undefined' || exchange.requestErrors.length < 1) {
        $details.find('.nav li:has(a[href="#reqerrors"])').hide();
        $('#reqerrors pre code').text('');
        $details.find('.nav a:first').tab('show');
    } else {
        $details.find('.nav li:has(a[href="#reqerrors"])').show();
        $('#reqerrors pre code').text(formatList(exchange.requestErrors));
    }

    // response
    $('#respheaders pre code').text(formatMap(exchange.backEndResponseHeaders));
    $('#respcontent pre code').text(exchange.backEndResponse);

    if (typeof exchange.responseErrors === 'undefined' || exchange.responseErrors.length < 1) {
        $details.find('.nav li:has(a[href="#resperrors"])').hide();
        $('#resperrors pre code').text('');
        $details.find('.nav a:first').tab('show');
    } else {
        $details.find('.nav li:has(a[href="#resperrors"])').show();
        $('#resperrors pre code').text(formatList(exchange.responseErrors));
    }

    // proxy details
    $('#proxyresponse pre code').text(exchange.proxyResponse);

    // syntax highlighting
    console.log('syntax hl');
    $('#exchangedetails pre code').each(function(i, block) {
        hljs.highlightBlock(block);
    });
}

function rowStyle(row) {
    if (row.requestValid && row.responseValid) {
        return {classes: 'success'};
    }
    else if ((!row.requestValid || !row.responseValid) && row.validatorId && row.validatorId !== "") {
        return {classes: 'danger'};
    }
    if (!row.requestXmlValid || !row.responseXmlValid) {
        return {classes: 'danger'};
    }
    return {classes: 'warning'};
}


function validatorFieldFormatter(value, row) {
    if (value)
        return '<a class="viewvalidator" href="ui#AffaireServiceWrite" onclick="viewValidator(this);">' + value + '</a>';
    else
        return '';
}
function responseTimeFieldFormatter(value) {
    if (value === -1) {
        return "Not available";
    }
    return value;
}
function statusFormatter(valid, xmlValid, validator) {
    if (valid) {
        return '<span class="text-success">valid</span>';
    }
    else if (!valid && validator && validator !== "") {
        return '<span class="text-danger">invalid</span>';
    }
    if (!xmlValid) {
        return '<span class="text-danger">invalid</span>';
    }
    return '<span class="text-warning">unknown</span>';
}

function validationStatusFormatter(value) {
    // need to support boolean and strings for retro-compat
    if (!isDefined(value) || value === "") {
        return '<span class="text-warning">unknown</span>';
    } else if (parseBoolean(value)) {
        return '<span class="text-success">valid</span>';
    } else if (!parseBoolean(value)) {
        return '<span class="text-danger">invalid</span>';
    }
    return value;
}

function validationFormatter(validating) {
    if (validating) {
        return "Validation active ";
    } else {
        return "Validation inactive ";
    }
}
function blockingFormatter(blocking) {
    if (blocking) {
        return "Blocking Mode";
    } else {
        return "Not Blocking Mode";
    }
    return status;
}

function viewValidator(validatorLink) {
    $('#menutabs a[href="#validators"]').tab('show');
    var validator = validatorLink.href.split('#')[1];
    window.location.hash = validator;
    return false;
}
function formatList(list) {
    var str = "";
    if (list) {
        jQuery.each(list, function(i, val) {
            str += val + String.fromCharCode(13);
        });
    }
    return str;
}

function formatMap(map) {
    var str = "";
    if (map) {
        jQuery.each(map, function(i, val) {
            if (i !== '-') {
                str += i + "=";
            }
            str += val + String.fromCharCode(13);
        });
    }
    return str;
}

function isDefined(value) {
    return typeof value !== 'undefined';
}

function parseBoolean(value) {
    if (value === "true" || (typeof value === 'boolean' && value === true)) {
        return true;
    } else if (value === "false" || (typeof value === 'boolean' && value === false)) {
        return false;
    }
    return;
}

