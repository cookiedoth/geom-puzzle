#!/usr/local/bin/python3
from http.server import BaseHTTPRequestHandler, HTTPServer
import mimetypes
import json
import os

PORT_NUMBER = 8016

class myHandler(BaseHTTPRequestHandler):

	def sendFileContent(self, path, **kwargs):
		path = os.curdir + os.sep + path
		try:
			f = open(path, "rb")
			self.send_response(200)
			self.send_header('Content-type', mimetypes.guess_type(path)[0])
			self.end_headers()
			self.wfile.write(f.read())
		except:
			self.send_response(500)
	
	def do_GET(self):
		if (self.path == '/'):
			self.sendFileContent('index.html')
		elif (self.path == '/get'):
			self.sendFileContent('scoreboard.json')
		elif (self.path.split(os.sep)[1] == 'static'):
			self.sendFileContent(self.path)
		else:
			self.sendFileContent('404.html')
		return

	def do_POST(self):
		if (self.path == '/post'):
			content_length = int(self.headers["Content-Length"])
			body = self.rfile.read(content_length).decode()
			print(body)

			data = json.loads(body)
			curTable = json.loads(open('scoreboard.json').read())

			found = 0
			for x in curTable:
				if (x['name'] == data['name']):
					x['score'] = max(x['score'], data['score'])
					found = 1
			
			if (not found):
				curTable.append(data)

			curTable.sort(key = lambda k: k['score'], reverse = True)

			f = open('scoreboard.json', 'w')
			f.write(json.dumps(curTable))

			self.send_response(200)
			self.end_headers()

try:
	server = HTTPServer(('', PORT_NUMBER), myHandler)
	print('The server has been started')
	server.serve_forever()
except KeyboardInterrupt:
	server.socket.close()
