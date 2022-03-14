// ----------------------------------------------------------------------

export default function Paper(theme) {
  return {
    MuiPaper: {
      defaultProps: {
        elevation: 0
      },

      styleOverrides: {
        root: {
          boxShadow: theme.customShadows.z0,
          backgroundImage: 'none'
        }
      }
    }
  };
}
