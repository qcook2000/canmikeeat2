import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import FU from './FirestoreUtils';
import Grid from '@material-ui/core/Grid';
import DatePicker from 'material-ui-pickers/DatePicker';
import moment from 'moment';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import LogSetDialog from './LogSetDialog';
import WorkoutHistorySection from './WorkoutHistorySection';

const styles = theme => ({
  button: {
    position: 'fixed',
    bottom: theme.spacing.unit * 2,
    right: theme.spacing.unit * 2,
  },
  body: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit ,
    marginTop: theme.spacing.unit * 2,
  }
});

class WorkoutsTab extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      logOpen: false,
      date: new Date(),
      data: [],
      excerciseNames: [],
    };
  }

  componentDidMount = () => {
    this.updateDate(new Date());
  }

  updateDate = date => {
    this.setState({date:date});
    if (this.unsub) this.unsub();
    var start = moment(date).startOf('day').toDate();
    var end = moment(date).endOf('day').toDate();
    this.unsub = FU.db.collection('workout-history')
        .where('Date', '>=', start)
        .where('Date', '<=', end)
        .orderBy('Date')
        .onSnapshot(querySnapshot => {
      var newDataArray = [];
      var dSec = [];
      querySnapshot.forEach(element => {
        // Handler for two type of exercise fields
        if (dSec.length !== 0) {
          var oldE = dSec[0].data().Exercise && dSec[0].data().Exercise.id ? dSec[0].data().Exercise.id : dSec[0].data().Exercise;
          var newE = element.data().Exercise && element.data().Exercise.id ? element.data().Exercise.id : element.data().Exercise;
          if (newE !== oldE) {
            newDataArray.push(dSec);
            dSec = [];
          }
        } 
        dSec.push(element);
      });
      if (dSec.length) newDataArray.push(dSec);
      this.setState({data: newDataArray});
    });
  }

  componentWillUnmount = () => {
    this.unsub();
  }

  addButtonClicked = () => {
    this.setState({logOpen: true, logTime: new Date()});
  };

  handleClose = () => {
    this.setState({logOpen: false});
  }

  handleDateChanged = field => {
    return moment => {
      this.setState({ [field]: FU.timestampFromMoment(moment) });
    }
  }

  render() {
    return (
      <div className={this.props.classes.body}>
        <Grid container spacing={24}>
          <Grid item xs={12}>
            <DatePicker
              label='Exercise Date'
              fullWidth
              format="YYYY-MM-DD"
              value={this.state.date}
              onChange={this.handleDateChanged}
            />
          </Grid>
          
          {this.state.data.map( (value, index) => {
            return (
              <Grid item xs={12} key={index}>
                <WorkoutHistorySection data={value}/>
              </Grid>
            );
          }, this)}
        </Grid>
        <Button variant="fab" color='primary' className={this.props.classes.button} onClick={this.addButtonClicked}>
          <AddIcon />
        </Button>
        <LogSetDialog open={this.state.logOpen} handleClose={this.handleClose} key={this.state.logTime}/>
      </div>
    );
  }
}

WorkoutsTab.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(WorkoutsTab);
