import { useTranslation, Trans } from 'react-i18next';
import Button from '@material-ui/core/Button';
import NavBar from 'components/NavBar'
import Footer from 'components/Footer'

const Home = () => {
    const { t } = useTranslation();
    return (
    <>
        <NavBar/>
        <div className="w-full h-auto mt-4" >
            <p className=" text-3xl md:text-4xl lg:text-5xl font-bold text-red"style={{marginLeft:"5%", paddingTop:"5%", paddingBottom:"10%"}} >Discuss anything with anyone,<br/><br/>In anywhere </p>
            <div className="pb-4">
                <Button variant="contained" color="secondary" style={{marginLeft:"5%"}}>
                 Starting  now
                </Button>
                <Button variant="contained" color="secondary" style={{marginLeft:"3%"}}>
                    Shop Now
                </Button><br/><br/>
            </div>
        </div>
        <Footer/>   
    </>
    );
  }
  
  export default Home;