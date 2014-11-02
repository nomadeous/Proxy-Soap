/*********************************************
 * COOKIE MANAGEMENT
 *********************************************/
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
    },
    bake_cookie: function(name, value) {
        var cookie = [name, '=', JSON.stringify(value), '; domain=.', window.location.host.toString(), '; path=/;'].join('');
        document.cookie = cookie;
    },
    read_cookie: function(name) {
        var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
        result && (result = JSON.parse(result[1]));
        return result;
    },
    delete_cookie: function(name) {
        document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/; domain=.', window.location.host.toString()].join('');
    }
};

/*********************************************
 * /COOKIE MANAGEMENT
 *********************************************/

// create fully selectable areas
jQuery.fn.selectText = function() {
    var doc = document;
    var element = this[0];
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
        //var fields = Cookie.get('fields');
        //if (!fields)
        //    fields = {};
        /*
         var fields = {};
         console.log("Cookie fields : " + fields);
         fields[field] = checked;
         console.log("fields : " + fields);
         for (var k in fields) {
         // use hasOwnProperty to filter out keys from the Object.prototype
         if (fields.hasOwnProperty(k)) {
         console.log('key is: ' + k + ', value is: ' + fields[k]);
         }
         }
         console.log("fields : " + fields[field]);
         Cookie.set('fields', fields);
         console.log('Event: column-switch.bs.table, data: ' +
         field + ', ' + checked);*/
        // read
        var fields = $.cookie('fields')
        if (fields === undefined) {
            fields = {};
        } else {
            fields = JSON.parse(fields);
        }
        fields[field] = checked;
        // save
        $.cookie('fields', JSON.stringify(fields));
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
                    url: 'exchange/' + rowData.id + '?accept=application/json',
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

    $('.viewvalidator').click(function() {
        $('#myTab a[href="#validators"]').tab('show');
    });

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
}
);

function rowStyle(row, index) {
    if (row.request_valid === "true" && row.response_valid === "true") {
        return {classes: 'success'};
    } else if ((row.request_valid !== "true" || row.response_valid !== "true") && row.validator !== "") {
        return {classes: 'danger'};
    } else if (row.request_xml_valid !== "true" || row.response_xml_valid !== "true") {
        return {classes: 'danger'};
    }
    return {classes: 'warning'};
}

function validatorFieldFormatter(value, row) {
    return '<a class="viewvalidator" href="ui#' + value + '" onclick="viewValidator(\'' + value + '\');return false;">' + value + '</a>';
}
function responseTimeFieldFormatter(value, row) {
    if (value === -1) {
        return "Not available";
    }
}
function viewValidator(validator) {
    $('#menutabs a[href="#validators"]').tab('show');
    window.location.hash = validator;
}
function formatList(list) {
    var str = "";
    jQuery.each(list, function(i, val) {
        str += val + String.fromCharCode(13);
    });
    return str;
}

function formatMap(map) {
    var str = "";
    jQuery.each(map, function(i, val) {
        if (i !== '-') {
            str += i + "=";
        }
        str += val + String.fromCharCode(13);
    });
    return str;
}

function displayExchange(exchange) {
    $details = $('#exchangedetails');
    $details.removeClass('hidden');
    $details.find('.panel-body').collapse('show');
    $('html,body').animate({
        scrollTop: $details.offset().top
    });

    $('#exchangeId').html(exchange.id);

    // request
    $('#reqheaders pre code').text(formatMap(exchange.request_headers));
    $('#reqcontent pre code').text(exchange.request_content);
    if (exchange.request_valid === "true") {
        $details.find('.nav li:has(a[href="#reqerrors"])').hide();
        $('#reqerrors pre code').text('');
        $details.find('.nav a:first').tab('show');
    } else {
        $details.find('.nav li:has(a[href="#reqerrors"])').show();
        $('#reqerrors pre code').text(formatList(exchange.request_errors));
    }

    // response
    $('#respheaders pre code').text(formatMap(exchange.response_headers));
    $('#respcontent pre code').text(exchange.response_content);
    console.log(exchange.response_errors);
    if (exchange.response_valid === "true"
            || (exchange.response_errors && exchange.response_errors.length < 1)) {
        $details.find('.nav li:has(a[href="#resperrors"])').hide();
        $('#resperrors pre code').text('');
        $details.find('.nav a:first').tab('show');
    } else {
        $details.find('.nav li:has(a[href="#resperrors"])').show();
        $('#resperrors pre code').text(formatList(exchange.response_errors));
    }

    // syntax highlighting
    console.log('syntax hl');
    $('#exchangedetails pre code').each(function(i, block) {
        hljs.highlightBlock(block);
    });
}

