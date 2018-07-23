import React from 'react';
import { TouchableHighlight, StyleSheet, Text, View, PickerIOS } from 'react-native';
import Sound from 'react-native-sound';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.setHour = this.setHour.bind(this);
    this.setMinute = this.setMinute.bind(this);
    this.handleStartPress = this.handleStartPress.bind(this);
    this.handleCancelPress = this.handleCancelPress.bind(this);
    this.startResumePauseButton = this.startResumePauseButton.bind(this);
    this.cancelButton = this.cancelButton.bind(this);
    this.playSound = this.playSound.bind(this);
    this.hourMinuteSecondFormat = this.hourMinuteSecondFormat.bind(this);
    this.runTimer = this.runTimer.bind(this);

    this.state = {
      running: false,
      timeRemaining: null,
      showTimePicker: true,
      selectedHour: 0,
      selectedMinute: 1
    };
    this.hoursItems = [];
    this.minutesItems = [];
    for (let i = 0; i < 24; i++) {
      this.hoursItems.push(<PickerIOS.Item key={i} value={i} label={i.toString()} />);
    }
    for (let j = 0; j < 60; j++) {
      this.minutesItems.push(<PickerIOS.Item key={j} value={j} label={j.toString()} />);
    }
    Sound.setCategory('Playback');
    this.soundObject = new Sound('long-gong-sound.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      }
      // loaded successfully
      console.log('duration in seconds: ' + this.soundObject.getDuration() + 'number of channels: ' + this.soundObject.getNumberOfChannels());
    });
  }
  render() {

    return (
        <View style={styles.container}>
          {this.timePickerOrTimer()}
          <View style={styles.buttonWrapper}>
            {this.cancelButton()}
            {this.startResumePauseButton()}
          </View>
        </View>
    );
  }
  timePickerOrTimer() {
    if (this.state.showTimePicker) {
      return (
          <View style={styles.pickerWrapper}>
            <PickerIOS style={styles.picker}
                       itemStyle={{fontWeight: 'bold'}}
                       selectedValue={this.state.selectedHour}
                       onValueChange={this.setHour}
            >
              {this.hoursItems}
            </PickerIOS>
            <PickerIOS style={styles.picker}
                       itemStyle={{fontWeight: 'bold'}}
                       selectedValue={this.state.selectedMinute}
                       onValueChange={this.setMinute}
            >
              {this.minutesItems}
            </PickerIOS>
          </View>
      )
    } else {
      return (
          <View style={styles.timerWrapper}>
            <Text style={styles.timer}>
              {this.hourMinuteSecondFormat(this.state.timeRemaining)}
            </Text>
          </View>
      )
    }
  }
  startResumePauseButton() {
    let style = this.state.running ? styles.pauseButton : styles.startResumeButton;
    return <TouchableHighlight
        underlayColor="gray"
        onPress={this.handleStartPress}
        style={[styles.button, style]}>
      <Text>
        {this.state.timeRemaining == null ? 'Start' : (this.state.running ? 'Pause' : 'Resume')}
      </Text>
    </TouchableHighlight>
  }
  cancelButton() {
    return <TouchableHighlight
        style={styles.button}
        underlayColor="gray"
        onPress={this.handleCancelPress}
    >
      <Text>
        Cancel
      </Text>
    </TouchableHighlight>
  }

  handleStartPress() {
    if (this.state.timeRemaining == null) {
      // Deal with the case when you press the start button
      let totalTime = (this.state.selectedHour * 60 + this.state.selectedMinute) * 60 * 1000;
      this.setState({
        timeRemaining: totalTime,
        running: true,
        showTimePicker: false
      });
      this.runTimer(totalTime);
    } else if (this.state.running) {
      // Deal with the case when you press the pause button
      clearInterval(this.interval);
      this.setState({
        running: false
      });
    } else {
      // Deal with the case when you press the resume button
      let totalTime = this.state.timeRemaining;
      this.setState({
        running: true,
      });
      this.runTimer(totalTime);
    }
  }

  runTimer(totalTime) {
    let startTime = new Date();
    this.interval = setInterval(() => {
      let timeRemaining = totalTime - (new Date() - startTime);
      if (timeRemaining > 0) {
        this.setState({
          timeRemaining: timeRemaining
        });
      } else {
        // Reset the time picker to the default position, reset timeRemaining to null
        clearInterval(this.interval);
        this.setState({
          showTimePicker: true,
          timeRemaining: null,
          running: false
        });
        this.playSound();
      }
    },60);
  }
  /**
   * Handle the case when the Cancel button is pressed.
   */
  handleCancelPress() {
    let duration = this.hourMinuteSecondFormat(this.state.timeRemaining);
    let timeArray = duration.split(':');
    let selectedHour = parseInt(timeArray[0]);
    let selectedMinute = parseInt(timeArray[1]);
    let selectedSecond = parseInt(timeArray[2]);

    if (selectedMinute == 59 && selectedSecond > 0) {
      selectedMinute = 0;
      selectedHour += 1;
    } else if (selectedSecond > 0) {
      selectedMinute += 1;
    }

    this.setHour(selectedHour);
    this.setMinute(selectedMinute);
    this.setState({
      showTimePicker: true,
      timeRemaining: null,
      running: false
    });
  }

  playSound() {
    this.soundObject.play((success) => {
      if (success) {
        console.log('successfully finished playing');
        this.soundObject.stop();
      } else {
        console.log('playback failed due to audio decoding errors');
        // reset the player to its uninitialized state (android only)
        // this is the only option to recover after an error occured and use the player again
        this.soundObject.reset();
      }
    });
  }

  setHour(hour) {
    this.setState({
      selectedHour: hour
    });
  }
  setMinute(minute) {
    this.setState({
      selectedMinute: minute
    });
  }
  hourMinuteSecondFormat(duration) {
    if (duration == null) {
      return '00:00:00';
    }
    let totalSeconds = Math.floor(duration / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = Math.floor((totalSeconds % 3600) % 60);
    hours = hours < 10 ? '0' + hours : hours + '';
    minutes = minutes < 10 ? '0' + minutes : minutes + '';
    seconds = seconds < 10 ? '0' + seconds : seconds + '';
    return hours + ':' + minutes + ':' + seconds;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
  },
  pickerWrapper: {
    flex: 3,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  timerWrapper: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonWrapper: {
    flex: 3,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  timer: {
    fontSize: 60
  },
  button: {
    borderWidth: 2,
    height: 100,
    width: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  startResumeButton: {
    borderColor: '#00CC00'
  },
  pauseButton: {
    borderColor: '#FFF44F'
  },
  picker: {
    flex: 1
  }
});
