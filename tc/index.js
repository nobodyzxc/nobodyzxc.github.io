
function copyToClipboard(text) {
    var dummy = document.createElement("textarea");
    // to avoid breaking orgain page when copying more words
    // cant copy when adding below this code
    // dummy.style.display = 'none'
    document.body.appendChild(dummy);
    //Be careful if you use texarea. setAttribute('value', value), which works with "input" does not work with "textarea". – Eduard
    dummy.value = text;
    dummy.select();
    dummy.setSelectionRange(0, 99999); /*For mobile devices*/
    document.execCommand("copy");
    document.body.removeChild(dummy);
}

function makeid(length, characters) {
    // don't use '>', '<', '&', '"'
    // String.fromCharCode(0x30A0 + Math.random() * (0x30FF-0x30A0+1));
    var result           = '';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

String.prototype.shuffle = function () {
    var a = this.split(""),
        n = a.length;

    for(var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a.join("");
}

var digits = '0123456789!#$%\'()*+,-./:;=?@[\\]^_`{|}~';
var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function genCode(){
    var len = getRandomInt(3) + 6;
    var d = getRandomInt(len - 1) + 1;
    var c = len - d;
    var code = makeid(d, digits) + makeid(c, chars);
    return code.shuffle();
}

function colored(text, regex){
    return text.replace(regex, function(str) {return '<span style="color:#FF0000">'+str+'</span>'});
}

function searchAppend(regex, bz){
    bz = Math.min(Math.max(1, bz), 5000);
    for(var iter = 0; iter < bz; iter++){
        var pass = genCode();
        var trip = tripcode(pass);
        var match = regex.exec(trip);
        total += 1;
        if(match != null) {
            var result = `result-${count}`;
            count += 1;
            var entry = $(`<a href="javascript:void(0);" id="${result}" onclick='copyToClipboard(${JSON.stringify(pass)});' class="list-group-item">${colored(trip, regex)} # ${pass}</a>`);
            entry.tooltip({title: "copied!", trigger: "click"});
            //entry.on('click', function(){
            //    setTimeout(function() { entry.tooltip('hide') }, 1000);
            //});
            $('#result').append(entry);
        }
    }
    $('#count').text(`(${count}/${total})`);
}

var searching = undefined;
var count = 0;
var total = 0;
var SEARCH = "Search"
var STOP = "Stop"
function searchCodes(){
    if($('#search').hasClass('disabled')) return;
    if($('#search').text() === SEARCH){
        $('#test-regex').attr('disabled', true);
        $('#result').empty();
        $('#search').text(STOP);
        var numberOfMilliseconds = 1;
        count = 0;
        total = 0;
        searching = setInterval(
            searchAppend.bind(null, new RegExp($('#test-regex').val(), $('#igcase').is(":checked") ? 'i': ''), $('#batch_size').val()),
            numberOfMilliseconds);
    }
    else{
        $('#test-regex').attr('disabled', false);
        $('#search').text(SEARCH);
        clearInterval(searching);
    }
}

$(document).ready(function(){
    /* quick regex test */
    function setIcon(s, icon){
        return $(s).removeClass('glyphicon-ok')
            .removeClass('glyphicon-warning-sign')
            .removeClass('glyphicon-remove')
            .addClass(icon);
    }

    function setStatus(s, status, title = ''){
        return $(s).removeClass('has-success')
            .removeClass('has-warning')
            .removeClass('has-error')
            .addClass(status)
            .attr('title', title);
    }

    $('.test-input').on('input focus',function(e){
        var valid = true,
            regex = $('#test-regex').val(),
            string = $('#test-string').val();
        try{
            regex = new RegExp(regex);
        }
        catch(e){
            valid = false;
            setStatus('#test-string-status', 'has-warning', 'Please correct your RegExp');
            setIcon('#test-string-icon', 'glyphicon-warning-sign');
            setStatus('#test-regex-status', 'has-warning', e);
            setIcon('#test-regex-icon', 'glyphicon-warning-sign');
            $('#search').addClass('disabled');
        }
        if(valid){
            setStatus('#test-regex-status', 'has-sucess');
            setIcon('#test-regex-icon', 'glyphicon-ok');
            $('#search').removeClass('disabled');
            if($('#test-string').val().match(regex)){
                setStatus('#test-string-status', 'has-sucess');
                setIcon('#test-string-icon', 'glyphicon-ok');
            }
            else{
                setStatus('#test-string-status', 'has-error', 'String not match the RegExp');
                setIcon('#test-string-icon', 'glyphicon-remove');
            }
        }
    });

})

$(document).on('shown.bs.tooltip', function (e) {
    setTimeout(function () {
        $(e.target).tooltip('hide');
    }, 1000);
});
