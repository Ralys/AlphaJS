AlphaJS
=======

AlphaJS is a JavaScript library that allows you to easily create class, providing you a different way to manage models. This library also cares about user interface and experience.
Alpha.ui contains classes and builders for graphical components.

Website: <http://ralys.github.io/AlphaJS>

Dependencies: jQuery

## Alpha.createClass

```javascript
var MyClass = Alpha.createClass({
    name: ...,
    parents: [...],
    properties: ...,
    strict: true,
    init: function() {
    	...
	}
});
```

You can easily create a class by giving the following information :
- **name**, name of the class
- **parents** (optional), array of constructors for multi-inheritence
- **properties**, the attributes and methods of the class. The methods will be put in the prototype of the class.
- **strict** (optional), boolean: if true, you won't be able to add new property to an instance of this class
- **init**, function that will be executed when an object is created

Every generated class contains the following methods:
1. get returns one or several attributes (excepting methods). It can be useful when you want to exchange JSON data;
2. set modifies one or several attributes (including methods);
3. clone returns a copy of the current instance.

## Alpha.createObject

If you want to use the get, set and clone methods without creating a class, you can use the constructor Alpha.createObject.

```javascript
var human = Alpha.createObject({
    name: 'Marc',
    age: 26
});
 
var name = human.get('name');
```

## Alpha.ui.Element
All the graphical components extended the class Alpha.ui.Element. This class contains useful attributes and methods for DOM manipulation, such as $container. The default $container is the body of the page.

```javascript
var element = new Alpha.ui.Element({
    $container: ...,
    $el: ...,

    render: function() {
    	...
	},
	show: function() {
		...
	},

	onShow_effect: function() {
		...
	},

	onHide_effect: function() {
		...
	},
});
```

When you use the method **set** on an object inheriting Alpha.ui.Element, you change in real time the value of the attribute in the DOM but the name of CSS class has to be the same of the name of the attribute.

Example:
```html
<div class="name">Georges</div>
```

## Alpha.ui.loadCSS
If you want to use the following Alpha.ui components, you can load dynamically a stylesheet by using the method **Alpha.ui.loadCSS()**.
The stylesheets contains the work of [Daneden](http://github.com/Daneden) called **animate.css**.
You should really check it out: <http://daneden.github.io/animate.css/>, it's pretty awesome.

This method calls another called: **Alpha.ui.loadStylesheet** that you can use to dynamically load CSS files.

```javascript
	Alpha.ui.loadCSS();
	Alpha.ui.loadStylesheet('http://rawgit.com/daneden/animate.css/master/animate.css');
```

## Alpha.ui.Button
Buttons are very important in a web application. So, it's very understandable to have an easy way to manage them. AlphaJS provides this way with Alpha.ui.Button

```javascript
var button = new Alpha.ui.Button({
    $container: '#buttons',
    type: 'button',
    'class': 'blue radius-corner',
    content: '#YOLO Button',
    onClick: function() {
        alert("I'm a blue button! #YOLO")
    }
});
 
button.show();
```

## Alpha.ui.ModalBox
Tired of making modal box over and over. Here is a little something for you that will spare you some time. All you have to do is to give a title and a content.

```javascript
var modal1 = new Alpha.ui.ModalBox({
    title: 'Modal 1',
    content: 'Modal box for container 1'
});
```

If you want to add buttons, there is the method **addButton()** for that:
```javascript
modal1.addButton(new Alpha.ui.Button({
	type: 'button',
	'class': 'green',
	content: 'Say hi',
	
	onClick: function() {
		alert('Hi!');
	}
}));
```

## Alpha.ui.SideBox
Sideboxes are boxes showing on the sides of the screen when a certain selector appear on the screen. After you've created all of the sideboxes, do not forget to use the method **Alpha.ui.SideBox.showAll**. Theses boxes can be used to add complementary information.

```javascript
var sidebox = new Alpha.ui.SideBox({
    $appearOn: '#selector',
    direction: 'right',
    title: "I'm a SideBox",
    content: "Hello friend! :)"
});
 
Alpha.ui.SideBox.showAll();
```

## Alpha.ui.SearchWidget
This is a specific component that implements a search process. By ticking a result, you will add it to the guests list.

Please check the [website](http://ralys.github.io/AlphaJS/#alpha.ui.searchwidget) for more information.
