import { classNames, PropTypes, MenuBar, MenuItem, MenuItemSeparator, Alert } from '../../third_party';

/**
 * 帮助菜单
 * @author tengge / https://github.com/tengge1
 */
class HelpMenu extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showAbout: false,
        };

        this.handleSource = this.handleSource.bind(this);
        this.handleExamples = this.handleExamples.bind(this);
        this.handleDocuments = this.handleDocuments.bind(this);
        this.handleAbout = this.handleAbout.bind(this);
    }

    render() {
        return <>
            <MenuItem title={L_HELP}>
                <MenuItem title={L_SOURCE} onClick={this.handleSource}></MenuItem>
                <MenuItem title={L_EXAMPLES} onClick={this.handleExamples}></MenuItem>
                <MenuItem title={L_DOCUMENTS} onClick={this.handleDocuments}></MenuItem>
                <MenuItem title={L_ABOUT} onClick={this.handleAbout}></MenuItem>
            </MenuItem>
            {this.state.showAbout && <Alert title={L_ABOUT} okText={L_OK}>
                {L_NAME}: ShadowEditor
                {L_AUTHOR}: tengge
                {L_LISENSE}: MIT
                {L_SOURCE}1: https://github.com/tengge1/ShadowEditor
                {L_SOURCE}2: https://gitee.com/tengge1/ShadowEditor
            </Alert>}
        </>;
    }

    handleSource() {
        window.open('https://github.com/tengge1/ShadowEditor', '_blank');
    }

    handleExamples() {
        window.open('https://github.com/tengge1/ShadowEditor-examples', '_blank');
    }

    handleDocuments() {
        window.open('https://tengge1.github.io/ShadowEditor/', '_blank');
    }

    handleAbout() {
        this.setState({
            showAbout: true,
        });
    }
}

export default HelpMenu;