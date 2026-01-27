#include <bits/stdc++.h>
using namespace std;
int main() {
    string name;
    int roll_number;
    float sum=0,avg;
    cin >> name >> roll_number;
    vector<int> marks(3);
    for(int i = 0; i < 3; i++) {
        cin >> marks[i];
        sum += marks[i];
    }
    avg=sum/3;
    cout << avg << endl;
    if(avg>=90){
        cout<<"A+";
    }
    else if(avg>=80){
        cout<<"A";
    }
    else if(avg>=70){
        cout<<"B+";
    }
    else if(avg>=60){
        cout<<"B";
    }
    else if(avg>=50){
        cout<<"C+";
    }
    else if(avg>=40){
        cout<<"C";
    }
    else{
        cout<<"D";
    }
}