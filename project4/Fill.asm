// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: project4/Fill.asm

// Runs an infinite loop that listens to the keyboard input. 
// When a key is pressed (any key), the program blackens the screen,
// i.e. writes "black" in every pixel. When no key is pressed, 
// the screen should be cleared.

(INITIALIZE)
    @SCREEN
    D=A

    @addr
    M=D

    @KBD
    D=M

    @BLACK
    D;JGT

    @BW
    M=0

    @LOOP
    0;JMP

    (BLACK)
        @BW
        M=-1

(LOOP)
    @BW
    D=M

    @addr
    A=M
    M=D

    @addr
    D=M+1

    @KBD
    D=A-D
    
    @INITIALIZE
    D;JLE

    @addr
    M=M+1

    @LOOP
    0;JMP

@INITIALIZE
0;JMP
















