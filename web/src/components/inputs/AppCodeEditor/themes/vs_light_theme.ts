const theme = {
  inherit: false,
  base: 'vs-dark',
  colors: {
    'editor.background': '#FFFFFF',
    'editor.foreground': '#000000',
    'editor.inactiveSelectionBackground': '#E5EBF1',
    'editorIndentGuide.background': '#D3D3D3',
    'editorIndentGuide.activeBackground': '#939393',
    'editor.selectionHighlightBackground': '#ADD6FF80',
    'editorSuggestWidget.background': '#F3F3F3',
    'activityBarBadge.background': '#007ACC',
    'sideBarTitle.foreground': '#6F6F6F',
    'list.hoverBackground': '#E8E8E8',
    'input.placeholderForeground': '#767676',
    'settings.textInputBorder': '#CECECE',
    'settings.numberInputBorder': '#CECECE'
  },
  rules: [
    {
      foreground: '#000000ff',
      token: 'meta.embedded'
    },
    {
      foreground: '#000000ff',
      token: 'source.groovy.embedded'
    },
    {
      fontStyle: 'italic',
      token: 'emphasis'
    },
    {
      fontStyle: 'bold',
      token: 'strong'
    },
    {
      foreground: '#000080',
      token: 'meta.diff.header'
    },
    {
      foreground: '#008000',
      token: 'comment'
    },
    {
      foreground: '#0000ff',
      token: 'constant.language'
    },
    {
      foreground: '#09885a',
      token: 'constant.numeric'
    },
    {
      foreground: '#811f3f',
      token: 'constant.regexp'
    },
    {
      foreground: '#800000',
      token: 'entity.name.tag'
    },
    {
      foreground: '#800000',
      token: 'entity.name.selector'
    },
    {
      foreground: '#ff0000',
      token: 'entity.other.attribute-name'
    },
    {
      foreground: '#800000',
      token: 'entity.other.attribute-name.class.css'
    },
    {
      foreground: '#800000',
      token: 'entity.other.attribute-name.class.mixin.css'
    },
    {
      foreground: '#800000',
      token: 'entity.other.attribute-name.id.css'
    },
    {
      foreground: '#800000',
      token: 'entity.other.attribute-name.parent-selector.css'
    },
    {
      foreground: '#800000',
      token: 'entity.other.attribute-name.pseudo-class.css'
    },
    {
      foreground: '#800000',
      token: 'entity.other.attribute-name.pseudo-element.css'
    },
    {
      foreground: '#800000',
      token: 'source.css.less entity.other.attribute-name.id'
    },
    {
      foreground: '#800000',
      token: 'entity.other.attribute-name.attribute.scss'
    },
    {
      foreground: '#800000',
      token: 'entity.other.attribute-name.scss'
    },
    {
      foreground: '#cd3131',
      token: 'invalid'
    },
    {
      fontStyle: 'underline',
      token: 'markup.underline'
    },
    {
      fontStyle: 'bold',
      foreground: '#000080',
      token: 'markup.bold'
    },
    {
      fontStyle: 'bold',
      foreground: '#800000',
      token: 'markup.heading'
    },
    {
      fontStyle: 'italic',
      token: 'markup.italic'
    },
    {
      foreground: '#09885a',
      token: 'markup.inserted'
    },
    {
      foreground: '#a31515',
      token: 'markup.deleted'
    },
    {
      foreground: '#0451a5',
      token: 'markup.changed'
    },
    {
      foreground: '#0451a5',
      token: 'punctuation.definition.quote.begin.markdown'
    },
    {
      foreground: '#0451a5',
      token: 'punctuation.definition.list.begin.markdown'
    },
    {
      foreground: '#800000',
      token: 'markup.inline.raw'
    },
    {
      foreground: '#800000',
      token: 'punctuation.definition.tag'
    },
    {
      foreground: '#0000ff',
      token: 'meta.preprocessor'
    },
    {
      foreground: '#a31515',
      token: 'meta.preprocessor.string'
    },
    {
      foreground: '#09885a',
      token: 'meta.preprocessor.numeric'
    },
    {
      foreground: '#0451a5',
      token: 'meta.structure.dictionary.key.python'
    },
    {
      foreground: '#0000ff',
      token: 'storage'
    },
    {
      foreground: '#0000ff',
      token: 'storage.type'
    },
    {
      foreground: '#0000ff',
      token: 'storage.modifier'
    },
    {
      foreground: '#a31515',
      token: 'string'
    },
    {
      foreground: '#0000ff',
      token: 'string.comment.buffered.block.pug'
    },
    {
      foreground: '#0000ff',
      token: 'string.quoted.pug'
    },
    {
      foreground: '#0000ff',
      token: 'string.interpolated.pug'
    },
    {
      foreground: '#0000ff',
      token: 'string.unquoted.plain.in.yaml'
    },
    {
      foreground: '#0000ff',
      token: 'string.unquoted.plain.out.yaml'
    },
    {
      foreground: '#0000ff',
      token: 'string.unquoted.block.yaml'
    },
    {
      foreground: '#0000ff',
      token: 'string.quoted.single.yaml'
    },
    {
      foreground: '#0000ff',
      token: 'string.quoted.double.xml'
    },
    {
      foreground: '#0000ff',
      token: 'string.quoted.single.xml'
    },
    {
      foreground: '#0000ff',
      token: 'string.unquoted.cdata.xml'
    },
    {
      foreground: '#0000ff',
      token: 'string.quoted.double.html'
    },
    {
      foreground: '#0000ff',
      token: 'string.quoted.single.html'
    },
    {
      foreground: '#0000ff',
      token: 'string.unquoted.html'
    },
    {
      foreground: '#0000ff',
      token: 'string.quoted.single.handlebars'
    },
    {
      foreground: '#0000ff',
      token: 'string.quoted.double.handlebars'
    },
    {
      foreground: '#811f3f',
      token: 'string.regexp'
    },
    {
      foreground: '#0000ff',
      token: 'punctuation.definition.template-expression.begin'
    },
    {
      foreground: '#0000ff',
      token: 'punctuation.definition.template-expression.end'
    },
    {
      foreground: '#0000ff',
      token: 'punctuation.section.embedded'
    },
    {
      foreground: '#000000',
      token: 'meta.template.expression'
    },
    {
      foreground: '#0451a5',
      token: 'support.constant.property-value'
    },
    {
      foreground: '#0451a5',
      token: 'support.constant.font-name'
    },
    {
      foreground: '#0451a5',
      token: 'support.constant.media-type'
    },
    {
      foreground: '#0451a5',
      token: 'support.constant.media'
    },
    {
      foreground: '#0451a5',
      token: 'constant.other.color.rgb-value'
    },
    {
      foreground: '#0451a5',
      token: 'constant.other.rgb-value'
    },
    {
      foreground: '#0451a5',
      token: 'support.constant.color'
    },
    {
      foreground: '#ff0000',
      token: 'support.type.vendored.property-name'
    },
    {
      foreground: '#ff0000',
      token: 'support.type.property-name'
    },
    {
      foreground: '#ff0000',
      token: 'variable.css'
    },
    {
      foreground: '#ff0000',
      token: 'variable.scss'
    },
    {
      foreground: '#ff0000',
      token: 'variable.other.less'
    },
    {
      foreground: '#ff0000',
      token: 'source.coffee.embedded'
    },
    {
      foreground: '#0451a5',
      token: 'support.type.property-name.json'
    },
    {
      foreground: '#0000ff',
      token: 'keyword'
    },
    {
      foreground: '#0000ff',
      token: 'keyword.control'
    },
    {
      foreground: '#000000',
      token: 'keyword.operator'
    },
    {
      foreground: '#0000ff',
      token: 'keyword.operator.new'
    },
    {
      foreground: '#0000ff',
      token: 'keyword.operator.expression'
    },
    {
      foreground: '#0000ff',
      token: 'keyword.operator.cast'
    },
    {
      foreground: '#0000ff',
      token: 'keyword.operator.sizeof'
    },
    {
      foreground: '#0000ff',
      token: 'keyword.operator.instanceof'
    },
    {
      foreground: '#0000ff',
      token: 'keyword.operator.logical.python'
    },
    {
      foreground: '#09885a',
      token: 'keyword.other.unit'
    },
    {
      foreground: '#800000',
      token: 'punctuation.section.embedded.begin.php'
    },
    {
      foreground: '#800000',
      token: 'punctuation.section.embedded.end.php'
    },
    {
      foreground: '#0451a5',
      token: 'support.function.git-rebase'
    },
    {
      foreground: '#09885a',
      token: 'constant.sha.git-rebase'
    },
    {
      foreground: '#000000',
      token: 'storage.modifier.import.java'
    },
    {
      foreground: '#000000',
      token: 'variable.language.wildcard.java'
    },
    {
      foreground: '#000000',
      token: 'storage.modifier.package.java'
    },
    {
      foreground: '#0000ff',
      token: 'variable.language'
    }
  ],
  encodedTokensColors: []
};

export default theme;
