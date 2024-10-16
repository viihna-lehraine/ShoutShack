/** @type {import('tailwindcss').Config} */
export default {
  content: [
		'./public/**/*.html',
	],
  theme: {
    extend: {
			colors: {
				'black-blue': '#050728',
				'black-green': '#011206',
				'dark-blue': '#1E1E3A',
				'dark-green': '#073A18',
				'light-blue': '#7269D4',
				'light-green': '#1BE8E43',
				'near-white': '#FDFDFD',
				'screech-light-blue': '#0BE6B5',
				'screech-pink': '#F97AD4',
				'screech-purple': '#A22DED',
				'screech-yellow': '#BCEB30',
				'white-blue': 'D4D1FA',
				'white-green-1': '#F6FBE9',
				'white-green-2': '#CBE5C4'
			}
		}
  },
  plugins: [],
	purge: ['./public/**/*.html']
}

