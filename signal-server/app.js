const express = require('express');
const SignalServer = require('./signal-server');

let signalServer = new SignalServer();
signalServer.start();