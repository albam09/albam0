"use strict";
/// <reference path="./@types.d.ts" />
// dev
const log = console.log;
/**
 *  @Import { socket client } - Socket.io 라이브러리를 사용하지 않으므로 관련 코드 제거
 */
// const client = io.connect(); // Socket.io를 사용하지 않으므로 이 부분 제거

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const $form = (s) => document.querySelector(`form[${s}]`);
const $$form = () => document.querySelectorAll("form");
const $input = (s) => document.querySelector(`input[${s}]`);
const $$input = () => document.querySelectorAll("input");
const $$inputInForm = (f) => document.querySelectorAll(`form[${f}] input`);
const $textarea = (f) => document.querySelector(`textarea[${f}]`);
const $button = (s) => document.querySelector(`button[${s}]`);
const $$button = (s) => {
    return s == undefined
        ? document.querySelectorAll("button")
        : document.querySelectorAll(`button[${s}]`);
};
const $a = (s) => document.querySelector(`a[${s}]`);
const $$a = (s) => document.querySelectorAll(`a[${s}]`);
const $select = (s) => document.querySelector(`select[${s}]`);
const $option = (s) => document.querySelector(`option[${s}]`);
const $img = (s) => document.querySelector(`img[${s}]`);
const sleep = (ms) => {
    return new Promise((rsv) => {
        return setTimeout(rsv, ms);
    });
};
var Elem;
(function (Elem) {
    const setter = (t, o) => {
        const e = document.createElement(t);
        if (o != undefined) {
            for (const [k, v] of Object.entries(o)) {
                e.setAttribute(k, v);
            }
        }
        return e;
    };
    Elem.create = {
        div: (o) => setter("div", o),
        span: (o) => setter("span", o),
        button: (o) => setter("button", o),
        form: (o) => setter("form", o),
        input: (o) => setter("input", o),
        label: (o) => setter("label", o),
        a: (o) => setter("a", o),
        select: (o) => setter("select", o),
        option: (o) => setter("option", o),
        section: (o) => setter("section", o),
        img: (o) => setter("img", o)
    };
})(Elem || (Elem = {}));
var Appender;
(function (Appender) {
    const factory = (p, elemCreateFunc, innerHTML, attr) => {
        const e = attr != null
            ? elemCreateFunc(attr)
            : elemCreateFunc();
        if (innerHTML != null) {
            e.innerHTML = innerHTML;
        }
        p.append(e);
        return e;
    };
    Appender.div = (p, innerHTML, attr) => {
        return factory(p, Elem.create.div, innerHTML, attr);
    };
    Appender.span = (p, innerHTML, attr) => {
        return factory(p, Elem.create.span, innerHTML, attr);
    };
    Appender.form = (p, innerHTML, attr) => {
        return factory(p, Elem.create.form, innerHTML, attr);
    };
    Appender.label = (f, innerHTML, attr) => {
        return factory(f, Elem.create.label, innerHTML, attr);
    };
    Appender.input = (f, innerHTML, attr) => {
        return factory(f, Elem.create.input, innerHTML, attr);
    };
    Appender.select = (f, innerHTML, attr) => {
        return factory(f, Elem.create.select, innerHTML, attr);
    };
    Appender.option = (s, innerHTML, attr) => {
        return factory(s, Elem.create.option, innerHTML, attr);
    };
    Appender.button = (f, innerHTML, attr) => {
        return factory(f, Elem.create.button, innerHTML, attr);
    };
    Appender.section = (p, innerHTML, attr) => {
        return factory(p, Elem.create.section, innerHTML, attr);
    };
    Appender.a = (p, innerHTML, attr) => {
        return factory(p, Elem.create.a, innerHTML, attr);
    };
    Appender.img = (p, innerHTML, attr) => {
        return factory(p, Elem.create.img, innerHTML, attr);
    };
})(Appender || (Appender = {}));
var Button;
(function (Button) {
    Button.disabled = (btn, b) => {
        btn.disabled = b;
        const innerHTML = btn.getAttribute(b ? "lock" : "unlock");
        btn.innerHTML = innerHTML;
    };
})(Button || (Button = {}));
var Body;
(function (Body) {
    // static elems
    const body = $("body");
    // funcs
    Body.lock = () => {
        body.setAttribute("lock", "");
    };
    Body.unLock = () => {
        body.removeAttribute("lock");
    };
})(Body || (Body = {}));
var Alert;
(function (Alert) {
    // static elems
    const divAlertWrapper = $("div[alert-wrapper]");
    const divText = $("div[alert-wrapper] [alert] div[text]");
    const buttonClose = $button("alert-close");
    // funcs
    Alert.docError = () => {
        divText.innerHTML = "Document 오류. 페이지를 새로고침 해주세요.";
        divAlertWrapper.setAttribute("show", "");
        buttonClose.focus();
        Body.lock();
    };
    Alert.open = (msg) => {
        divText.innerHTML = msg;
        divAlertWrapper.setAttribute("show", "");
        buttonClose.focus();
        Body.lock();
    };
    const buttonCloseClickHandle = () => {
        for (const t of [divAlertWrapper, buttonClose]) {
            t.addEventListener("click", (evt) => {
                if (evt.target.hasAttribute("alert-close")) {
                    divAlertWrapper.removeAttribute("show");
                    Body.unLock();
                }
            });
        }
    };
    const eventListener = () => {
        buttonCloseClickHandle();
    };
    Alert.ready = () => {
        eventListener();
    };
})(Alert || (Alert = {}));
var Conv;
(function (Conv) {
    Conv.sToB = (s) => {
        return s == "true" ? true : false;
    };
})(Conv || (Conv = {}));
var Modal;
(function (Modal) {
    // static elems
    const divModals = $("body > div[modals]");
    const buttons = $$button("modal-close");
    // funcs
    Modal.open = (e) => {
        for (const d of [divModals, e]) {
            d.setAttribute("show", "");
        }
        Body.lock();
        Scroll.top(divModals);
    };
    const buttonsCloseClickHandle = () => {
        const childrens = divModals.children;
        for (const b of buttons) {
            b.addEventListener("click", () => {
                divModals.removeAttribute("show");
                for (const c of childrens) {
                    c.removeAttribute("show");
                }
                Body.unLock();
            });
        }
    };
    const eventListener = () => {
        buttonsCloseClickHandle();
    };
    Modal.ready = () => {
        if (divModals == null) {
            return;
        }
        eventListener();
    };
})(Modal || (Modal = {}));
var Scroll;
(function (Scroll) {
    Scroll.top = (e) => {
        e.scrollTo({ top: 0 });
    };
})(Scroll || (Scroll = {}));
{ // * Doc ready
    Alert.ready();
    Modal.ready();
}

// 2026-05-23 기사형 하단 게시판 페이지네이션
(function(){
  function initSeoArticleBoards(){
    document.querySelectorAll('[data-article-board]').forEach(function(board){
      var indicator = board.querySelector('.seo-article-page-indicator');
      board.querySelectorAll('[data-board-target]').forEach(function(btn){
        btn.addEventListener('click', function(){
          var target = btn.getAttribute('data-board-target') || '1';
          board.setAttribute('data-active-page', target);
          board.querySelectorAll('[data-board-target]').forEach(function(other){
            other.classList.toggle('is-active', other === btn);
          });
          if(indicator){
            var total = board.querySelectorAll('[data-board-target]').length || 1;
            indicator.textContent = target + ' / ' + total;
          }
        });
      });
    });
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initSeoArticleBoards);
  } else {
    initSeoArticleBoards();
  }
})();
