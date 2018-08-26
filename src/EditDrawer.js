import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FirestoreSelect from './FirestoreSelect';
import Drawer from '@material-ui/core/Drawer';
import Typography from '@material-ui/core/Typography';
import DatePicker from 'material-ui-pickers/DatePicker';
import FU from './FirestoreUtils';

const styles = theme => ({
  paper: {
    padding: theme.spacing.unit * 3,
    width: '300px',
  },
  title: {
    marginBottom: theme.spacing.unit * 3,
  },
  formInput: {
    marginBottom: theme.spacing.unit * 3,
  },
});

class EditDrawer extends React.Component {
  constructor(props) {
    super(props);
    this.state = !props.editingItem || props.editingItem === 'new' ? {} : props.editingItem;

    this.state.referenceFieldOptions = {};
    this.state.referenceFieldSelected = {};
  }


  componentDidMount = () => {
    this.unsub = [];
    this.props.columns.forEach(column => {
      if (column.type !== FU.Types.Reference) {
        return;
      }

      this.unsub.push(FU.db.collection(column.referenceCollection).onSnapshot(querySnapshot => {
        var newData = [];
        this.querySnapshot = querySnapshot;
        var selected = null;
        querySnapshot.forEach(element => {
          var option = {value: element.id, label: element.data().name};
          if (this.state[column.id]) {
            if (this.state[column.id] === element.data().name || this.state[column.id].id === element.id) {
              selected = option;
            }
          }
          newData.push(option);
        });

        var referenceFieldOptions = {...this.state.referenceFieldOptions}
        referenceFieldOptions[column.id] = newData;
        this.setState({referenceFieldOptions: referenceFieldOptions});
        
        var referenceFieldSelected = {...this.state.referenceFieldSelected}
        referenceFieldSelected[column.id] = selected;
        this.setState({referenceFieldSelected: referenceFieldSelected})
      }));
    });
  }

  componentWillUnmount = () => {
    this.unsub.forEach(unsuber => {
      unsuber();
    });
  }


  handleAddOrSave = () => {
    var newItem = {}
    this.props.columns.forEach(column => {
      if (this.state[column.id]) {
        newItem[column.id] = this.state[column.id];
      }
    });

    if (this.props.editingItem === 'new') {
      FU.db.collection(this.props.settings.path).add(newItem).then(response => {
        console.log("Added!", response);
        this.props.handleClose();
      }, function(error) {
        console.error("Failed!", error);
      });
    } else {
      FU.db.collection(this.props.settings.path).doc(this.props.editingItemId).set(newItem).then(response => {
        console.log("Edited!", response);
        this.props.handleClose();
      }, function(error) {
        console.error("Failed!", error);
      });
    }
  };

  dateHandlerForField = field => {
    return moment => {
      this.setState({ [field]: FU.timestampFromMoment(moment) });
    }
  }

  handleTextChange = event => {
    var type = this.props.columns.find(e => { return e.id === event.target.name}).type;
    var value = event.target.value;
    if (type === FU.Types.Number) value = parseFloat(value);
    this.setState({ [event.target.name]: value });
  };

  selectHandlerForField = field => {
    return option => {
      if (!option || !option.value) return;
      var column = this.props.columns.find(e => { return e.id === field});
      this.setState({ [field]: FU.db.collection(column.referenceCollection).doc(option.value) });
      var referenceFieldSelected = {...this.state.referenceFieldSelected}
      referenceFieldSelected[field] = option;
      this.setState({referenceFieldSelected: referenceFieldSelected})
    }
  };

  titlePrefix = () => {
    return this.props.editingItem === 'new' ? 'Add ' : 'Edit '
  }

  render() {
    const { classes, columns, settings, handleClose, editingItem} = this.props;

    return (
      <Drawer anchor="right" open={editingItem ? true : false} onClose={handleClose} classes={{paper: classes.paper}}>
        <Typography variant='title' className={classes.title}>{this.titlePrefix() + settings.drawerItemName}:</Typography>
        <form className={classes.root} autoComplete="off">
          {columns.map(column => {
            return (
              <div className={classes.formInput} key={column.id}>
                {column.type === FU.Types.Date ? (
                  <DatePicker
                    label={column.name}
                    fullWidth
                    format="YYYY-MM-DD"
                    value={this.state[column.id] ? this.state[column.id].toDate() : null}
                    onChange={this.dateHandlerForField(column.id)}
                  />
                ) : column.type === FU.Types.Reference ? (
                  <FirestoreSelect
                    options={this.state.referenceFieldOptions[column.id]}
                    placeholder={column.name}
                    onChange={this.selectHandlerForField(column.id)}
                    value={this.state.referenceFieldSelected[column.id]}
                  />
                ) : (
                  <TextField 
                    coltype={column.type}
                    value={this.state[column.id] ? this.state[column.id] : ''} 
                    name={column.id} 
                    onChange={this.handleTextChange} 
                    fullWidth 
                    label={column.name} 
                    multiline={column.type === FU.Types.LongString}
                    type={column.type === FU.Types.Number ? 'number' : 'text'}/>
                )}
              </div>
            );
          }, this)}
        </form>
        <Button onClick={handleClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={this.handleAddOrSave} color="primary">
          {this.titlePrefix() + settings.drawerItemName}
        </Button>
      </Drawer>
    );
  }
}

EditDrawer.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(EditDrawer);