var site_url = "http://localhost:8080"

var nodes = new vis.DataSet([
	{id: 0, label: 'Node 0', hash: "ROOT of http://localhost:8080"},
	{id: 1, label: 'Node 1', hash: "\nSample HTML page <a href=\"a.html\" id=\"a\">To A</a>\n<a href=\"a.html\" id=\"ab\">To A</a>\n<a href=\"b.html\" id=\"b\">To B</a>\n<a href=\"\">To null</a>\n<a href=\"#\">To #</a> <img src=\"img/test.png\"> "},
	{id: 2, label: 'Node 2', hash: "\nB is here <a href=\"a.html\">a</a> "},
	{id: 3, label: 'Node 3', hash: "\nA has been crawled\n<a href=\"index.html\" id=\"index\">index</a> "}]);

var edges = new vis.DataSet([
	{from: 0, to: 1, last_action: "GotoAction: http://localhost:8080"},
	{from: 1, to: 1, last_action: "ClickAction: HTML > BODY:nth-child(2) > A:nth-child(4)"},
	{from: 1, to: 2, last_action: "ClickAction: #b"},
	{from: 2, to: 3, last_action: "ClickAction: HTML > BODY:nth-child(2) > A:nth-child(1)"},
	{from: 3, to: 1, last_action: "ClickAction: #index"},
	{from: 1, to: 3, last_action: "ClickAction: #a"}]);

