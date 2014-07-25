module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		yeoman: {
            app: 'app',
            dist: 'dist'
        },

		concat: {
			options: {
				separator: ';'
			},
			dist: {
				src: ['src/**/*.js'],
				dest: 'dist/<%= pkg.name %>.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			},
			dist: {
				files: {
					'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
				}
			}
		},

        connect: {
            server: {
                options: {
                    port: 8000,
                    hostname: '*',
                    livereload: 35729
                }
            }
        },

        watch: {
		    options: {
		        livereload: '<%= connect.server.options.livereload %>',
		      	files: [
                    '<%= yeoman.app %>/**/*.html',
                    '<%= yeoman.app %>/**/*.js',
                    '<%= yeoman.app %>/img/*.{png,gif,svg}'
                ]
		    },
		    css: {
		      files: ['app/styles/less/*.less'],
		      tasks: ['less'],
		    },
		    gruntfile: {
                files: ['Gruntfile.js']
            },
		  },

        less: {
            development: {
                files: {
                    'app/styles/css/app.css': ['app/styles/less/app.less']
                }
            }
        }

	});

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.registerTask('serve', [
		'connect:server',
		'watch'
	]);

}
