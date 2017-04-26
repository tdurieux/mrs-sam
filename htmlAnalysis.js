module.exports = function() {
    var hostname = window.location.hostname;

    return {
        hostname: hostname,
        hash: generateHash(),
        selectors: grabSelector(),
        forms: grabForm()
    };

    function generateHash() {
        //return document.querySelector('body').innerHTML.replace(/\s{2,10}/g, ' ');
        //return document.body.innerHTML.replace(/\s{2,10}/g, ' ');
        return generateStructuralDOMHash(document.body);
    }

    function generateStructuralDOMHash(element) {
        var idAttribute = (element.attributes && element.hasAttribute("id")) ? `id="${element.getAttribute('id')}"` : "";
        var openTagName = element.tagName ? `<${element.tagName}${idAttribute}>\n` : "";
        var hash = openTagName;
        for (var i = 0; i < element.childNodes.length; i++) {
            hash = hash + generateStructuralDOMHash(element.childNodes[i]) + '\n';
        }
        var closeTagName = element.tagName ? `</${element.tagName}>\n` : "";
        hash = hash + closeTagName;
        return hash;
    }

    function grabSelector() {
        var selectors = new Array();
        var a_links = document.getElementsByTagName('a');
        for (var i = 0; i < a_links.length; i++) {
            if (!isMailTo(a_links[i])) selectors.push(computeSelector(a_links[i]));
        }

        var img_links = document.getElementsByTagName('img');
        for (var i = 0; i < img_links.length; i++) {
            selectors.push(computeSelector(img_links[i]));
        }
        return selectors;

    }

    function grabForm() {
        var forms = new Array();
        var form_tag = document.getElementsByTagName('form');
        for (var i = 0; i < form_tag.length; i++) {
            var form = { form_selector: computeSelector(form_tag) };
            form.inputs = new Array();
            var inputs = form_tag[i].getElementsByTagName('input')
            for (var i = 0; i < inputs.length; i++) {
                form.inputs.push({
                    selector: computeSelector(inputs[i]),
                    name: undefined || inputs[i].getAttribute('name'),
                    value: undefined || inputs[i].getAttribute('value'),
                    type: undefined || inputs[i].getAttribute('type')
                });
            }
            forms.push(form);
        }
        return forms;
    }

    function computeSelector(el) {
        var names = [];
        while (el.parentNode) {
            if (el.id) {
                names.unshift(`#${el.id}`);
                break;
            } else {
                if (el == el.ownerDocument.documentElement)
                    names.unshift(el.tagName);
                else {
                    for (var c = 1, e = el; e.previousElementSibling; e = e.previousElementSibling, c++);
                    names.unshift(`${el.tagName}:nth-child(${c})`);
                }
                el = el.parentNode;
            }
        }
        return names.join(" > ");
    }

    function isMailTo(a_link) {
        return a_link.href.includes('mailto');
    }
}