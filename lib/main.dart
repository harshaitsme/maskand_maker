import 'package:flutter/material.dart';

void main(){
  
  runApp(MyApp());
}

class MyApp extends StatelessWidget {

  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          backgroundColor: Colors.lightBlueAccent,
          title: const Text('Welcome!'),
        ),
        body: Container(
          margin: const EdgeInsets.all(10),
          padding: const EdgeInsets.all(10),
          alignment: Alignment.center,
          decoration: const BoxDecoration(
            color: Colors.cyanAccent,
            borderRadius: BorderRadius.all(Radius.circular(10)),
          ),
          child: const Text('M&M'),
        ),
      ),
    );
  }

}