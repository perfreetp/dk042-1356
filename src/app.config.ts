export default defineAppConfig({
  pages: [
    'pages/tasks/index',
    'pages/practice/index',
    'pages/records/index',
    'pages/result/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E5AA8',
    navigationBarTitleText: '航材周转件借还模拟',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F0F4F8'
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#1E5AA8',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/tasks/index',
        text: '任务列表'
      },
      {
        pagePath: 'pages/practice/index',
        text: '模拟操作'
      },
      {
        pagePath: 'pages/records/index',
        text: '成绩回放'
      }
    ]
  }
})
