import React, { lazy } from "react"
import { useSelector } from "react-redux"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from "@material-ui/core";
import { createTheme } from "@material-ui/core/styles";
import Header from "components/Header"

const Home = lazy(() => import("pages/Home"))
const Login = lazy(() => import("pages/Auth/Login"))
// const ForgotPassword = lazy(() => import("pages/Auth/ForgotPassword"))
// const InputEmail = lazy(() => import("pages/Auth/InputEmail"))
// const LockScreen = lazy(() => import("pages/Auth/LockScreen"))
const Register = lazy(() => import("pages/Auth/Register"))
// const Thankyou = lazy(() => import("pages/Auth/Thankyou"))
// const VerifyEmail = lazy(() => import("pages/Auth/VerifyEmail"))

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
  const theme = useSelector((state) => state.common.theme)
  const appliedTheme = createTheme(theme? light : dark);
  return (
    <Router>
      <div id="box" className={theme ? "" : "dark" }>
        <ThemeProvider theme={appliedTheme}>     
          <Header/>
          <Switch>
            <Route exact path="/" component={Home}/>
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            {/* <Route path="/Thankyou-Register" component={Thankyou}/>   
            <Route path="/verifyEmail" component={VerifyEmail}/>         
            <Route path="/forgot-password" component={ForgotPassword}/>
            <Route path='/input-email' component={InputEmail}/> */}
          </Switch>
          <ToastContainer />
        </ThemeProvider>
      </div>

    </Router>
  )
};

export default App;
