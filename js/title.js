var  OriginTitle  =  document.title;

var  titleTime;

document.addEventListener('visibilitychange', function () {

 if (document.hidden) {

 document.title  =  '(｀･ω･)等你回来！';

 clearTimeout(titleTime);

    }

 else {

 document.title  =  ' ﾟ ∀ﾟ)ノ欢迎回来！';

 titleTime  =  setTimeout(function () {

 document.title  =  OriginTitle;

}, 2000);

    }

});