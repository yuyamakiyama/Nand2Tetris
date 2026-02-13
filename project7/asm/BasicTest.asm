// push constant 10
@10
D=A
@SP
A=M
M=D
@SP
M=M+1
// pop local 0
@SP
M=M-1
A=M
D=M
@LCL
A=M
M=D
// push constant 21
@21
D=A
@SP
A=M
M=D
@SP
M=M+1
// push constant 22
@22
D=A
@SP
A=M
M=D
@SP
M=M+1
// pop argument 2
@SP
M=M-1
A=M
D=M
@ARG
A=M
A=A+1
A=A+1
M=D
// pop argument 1
@SP
M=M-1
A=M
D=M
@ARG
A=M
A=A+1
M=D
// push constant 36
@36
D=A
@SP
A=M
M=D
@SP
M=M+1
// pop this 6
@SP
M=M-1
A=M
D=M
@THIS
A=M
A=A+1
A=A+1
A=A+1
A=A+1
A=A+1
A=A+1
M=D
// push constant 42
@42
D=A
@SP
A=M
M=D
@SP
M=M+1
// push constant 45
@45
D=A
@SP
A=M
M=D
@SP
M=M+1
// pop that 5
@SP
M=M-1
A=M
D=M
@THAT
A=M
A=A+1
A=A+1
A=A+1
A=A+1
A=A+1
M=D
// pop that 2
@SP
M=M-1
A=M
D=M
@THAT
A=M
A=A+1
A=A+1
M=D
// push constant 510
@510
D=A
@SP
A=M
M=D
@SP
M=M+1
// pop temp 6
@SP
M=M-1
A=M
D=M
@11
M=D
// push local 0
@0
D=A
@LCL
D=D+M
A=D
D=M
@SP
A=M
M=D
@SP
M=M+1
// push that 5
@5
D=A
@THAT
D=D+M
A=D
D=M
@SP
A=M
M=D
@SP
M=M+1
// add
@SP
M=M-1
A=M
D=M
A=A-1
M=D+M
// push argument 1
@1
D=A
@ARG
D=D+M
A=D
D=M
@SP
A=M
M=D
@SP
M=M+1
// sub
@SP
M=M-1
A=M
D=M
A=A-1
M=M-D
// push this 6
@6
D=A
@THIS
D=D+M
A=D
D=M
@SP
A=M
M=D
@SP
M=M+1
// push this 6
@6
D=A
@THIS
D=D+M
A=D
D=M
@SP
A=M
M=D
@SP
M=M+1
// add
@SP
M=M-1
A=M
D=M
A=A-1
M=D+M
// sub
@SP
M=M-1
A=M
D=M
A=A-1
M=M-D
// push temp 6
@11
D=M
@SP
A=M
M=D
@SP
M=M+1
// add
@SP
M=M-1
A=M
D=M
A=A-1
M=D+M