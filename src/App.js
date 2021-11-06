import React, { Suspense, lazy } from "react"
import { Router, Switch, Route } from "react-router-dom"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from "@material-ui/core";
import { createTheme } from "@material-ui/core/styles";

const Login = lazy(() => import("pages/Auth/Login"))
const ForgotPassword = lazy(() => import("pages/Auth/ForgotPassword"))
const InputEmail = lazy(() => import("pages/Auth/InputEmail"))
const LockScreen = lazy(() => import("pages/Auth/LockScreen"))
const Register = lazy(() => import("pages/Auth/LoRegistergin"))
const Thankyou = lazy(() => import("pages/Auth/Thankyou"))
const VerifyEmail = lazy(() => import("pages/Auth/VerifyEmail"))

const light = {
  palette: {
    type: "light"
  }
};
const dark = {
  palette: {
    type: "dark"
  }
};

const App = (props) => {
  const appliedTheme = createTheme(this.props.theme? light : dark);
  return (
    <ThemeProvider theme={appliedTheme}>     
      <Switch>
        <Route exact path="/" component={Home}/>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/Thankyou-Register" component={Thankyou}/>   
        <Route path="/verifyEmail" component={VerifyEmail}/>         
        <Route path="/forgot-password" component={ForgotPassword}/>
        <Route path='/input-email' component={InputEmail}/>  
      </Switch>
      <ToastContainer />
    </ThemeProvider>
  );
};


export default App;
