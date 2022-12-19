document.addEventListener("DOMContentLoaded", function(event) {
    var keyword = ['int' , 'float' , 'long' , 'char' , 'short' , 'sizeof' , 'size_t' , 'void' , 'const']
    var pre = document.getElementsByTagName("code");
    for(var i = 0 ; i < pre.length ; i++){
        if(pre[i].className == "patch"){
            for(var kw in keyword){ // match keyword
                var rgx = new RegExp("\\b" + keyword[kw] , "g");
                pre[i].innerHTML = pre[i].innerHTML.replace(rgx ,
                            '<span style="color:#c9c">' + keyword[kw] + '</span>');
            }
            var rgx = /\*\w\(/g;
            var match , str = pre[i].innerHTML;
            if(match = rgx.exec(str)){
                var pos = rgx.lastIndex - 2;
                var ploc = str.slice(pos).indexOf('(') + str.slice(0 , pos).length;
                str = str.slice(0 , pos) + '<span style="color:#6cc">' +
                                str.slice(pos , ploc) + '</span>' + str.slice(ploc);
                pre[i].innerHTML = str;
            }
        }
    }
});
