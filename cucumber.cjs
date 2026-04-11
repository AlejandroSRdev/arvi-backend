module.exports = {
  default: {
    import: [
      'tests/acceptance/support/**/*.js',
      'tests/acceptance/steps/**/*.js',
    ],
    paths: ['tests/acceptance/features/**/*.feature'],
    publishQuiet: true,
  },
};
